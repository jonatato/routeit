import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

type Platform = "all" | "android" | "ios";
type Channel = "production" | "beta";

type OtaRelease = {
  id: number;
  channel: Channel;
  platform: Platform;
  bundle_version: string;
  file_path: string;
  checksum: string | null;
  mandatory: boolean;
  enabled: boolean;
  rollout_percent: number;
  native_min_version: string | null;
  native_max_version: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

const siteUrl = Deno.env.get("SITE_URL") ?? "*";
const allowedOrigins = new Set(
  (Deno.env.get("ALLOWED_ORIGINS") ?? siteUrl)
    .split(",")
    .map(value => value.trim())
    .filter(Boolean),
);

const corsHeaders = (origin: string | null) => {
  const allowOrigin = origin && (allowedOrigins.has("*") || allowedOrigins.has(origin))
    ? origin
    : (allowedOrigins.has("*") ? "*" : siteUrl);

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-ota-admin-token",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };
};

const splitVersion = (value: string): number[] =>
  value
    .trim()
    .replace(/^v/i, "")
    .split(".")
    .map(part => Number.parseInt(part.replace(/\D.*$/g, ""), 10))
    .map(n => (Number.isFinite(n) ? n : 0));

const compareVersions = (left: string, right: string): number => {
  const l = splitVersion(left);
  const r = splitVersion(right);
  const len = Math.max(l.length, r.length);
  for (let i = 0; i < len; i += 1) {
    const lv = l[i] ?? 0;
    const rv = r[i] ?? 0;
    if (lv > rv) return 1;
    if (lv < rv) return -1;
  }
  return 0;
};

const isVersionInNativeRange = (nativeVersion: string | null, min: string | null, max: string | null) => {
  if (!nativeVersion) return true;
  if (min && compareVersions(nativeVersion, min) < 0) return false;
  if (max && compareVersions(nativeVersion, max) > 0) return false;
  return true;
};

const rolloutBucket = (seed: string) => {
  let hash = 5381;
  for (let i = 0; i < seed.length; i += 1) {
    hash = ((hash << 5) + hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 100;
};

const pickUpdate = (
  releases: OtaRelease[],
  currentBundle: string,
  nativeVersion: string | null,
  deviceId: string,
): OtaRelease | null => {
  const candidates = releases
    .filter(release => compareVersions(release.bundle_version, currentBundle) > 0)
    .filter(release => isVersionInNativeRange(nativeVersion, release.native_min_version, release.native_max_version))
    .filter(release => {
      if (release.rollout_percent >= 100) return true;
      const bucket = rolloutBucket(`${deviceId}:${release.bundle_version}`);
      return bucket < release.rollout_percent;
    })
    .sort((a, b) => compareVersions(b.bundle_version, a.bundle_version));

  return candidates[0] ?? null;
};

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Missing Supabase configuration" }), { status: 500, headers });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const body = await req.json();
    const action = typeof body?.action === "string" ? body.action : "check";

    if (action === "check") {
      const channel = (body?.channel === "beta" ? "beta" : "production") as Channel;
      const platform = (body?.platform === "android" || body?.platform === "ios" ? body.platform : "all") as Platform;
      const currentBundle = typeof body?.currentBundle === "string" && body.currentBundle.trim() !== ""
        ? body.currentBundle.trim()
        : "0.0.0";
      const nativeVersion = typeof body?.nativeVersion === "string" && body.nativeVersion.trim() !== ""
        ? body.nativeVersion.trim()
        : null;
      const deviceId = typeof body?.deviceId === "string" && body.deviceId.trim() !== ""
        ? body.deviceId.trim()
        : req.headers.get("x-device-id") ?? "anonymous";

      const { data, error } = await supabase
        .from("ota_releases")
        .select("id, channel, platform, bundle_version, file_path, checksum, mandatory, enabled, rollout_percent, native_min_version, native_max_version, metadata, created_at")
        .eq("enabled", true)
        .eq("channel", channel)
        .in("platform", platform === "all" ? ["all"] : [platform, "all"])
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
      }

      const release = pickUpdate((data ?? []) as OtaRelease[], currentBundle, nativeVersion, deviceId);

      if (!release) {
        return new Response(JSON.stringify({ updateAvailable: false }), { status: 200, headers });
      }

      const bucket = Deno.env.get("OTA_BUNDLE_BUCKET") ?? "ota-bundles";
      const expiresIn = Number.parseInt(Deno.env.get("OTA_SIGNED_URL_TTL_SECONDS") ?? "3600", 10);
      const { data: signedData, error: signedError } = await supabase
        .storage
        .from(bucket)
        .createSignedUrl(release.file_path, Number.isFinite(expiresIn) ? expiresIn : 3600);

      if (signedError || !signedData?.signedUrl) {
        return new Response(
          JSON.stringify({ error: signedError?.message ?? "Could not create signed URL" }),
          { status: 500, headers },
        );
      }

      return new Response(JSON.stringify({
        updateAvailable: true,
        release: {
          id: release.id,
          channel: release.channel,
          platform: release.platform,
          bundleVersion: release.bundle_version,
          checksum: release.checksum,
          mandatory: release.mandatory,
          filePath: release.file_path,
          downloadUrl: signedData.signedUrl,
          metadata: release.metadata,
        },
      }), { status: 200, headers });
    }

    if (action === "createUploadUrl") {
      const adminToken = Deno.env.get("OTA_ADMIN_TOKEN") ?? "";
      const sentToken = req.headers.get("x-ota-admin-token") ?? "";

      if (!adminToken || sentToken !== adminToken) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
      }

      const channel = (body?.channel === "beta" ? "beta" : "production") as Channel;
      const bundleVersion = typeof body?.bundleVersion === "string" ? body.bundleVersion.trim() : "";

      if (!bundleVersion) {
        return new Response(JSON.stringify({ error: "bundleVersion is required" }), { status: 400, headers });
      }

      const bucket = Deno.env.get("OTA_BUNDLE_BUCKET") ?? "ota-bundles";
      const filePath = `${channel}/${bundleVersion}/dist.zip`;
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from(bucket)
        .createSignedUploadUrl(filePath, { upsert: true });

      if (uploadError || !uploadData?.token) {
        return new Response(
          JSON.stringify({ error: uploadError?.message ?? "Could not create signed upload URL" }),
          { status: 500, headers },
        );
      }

      return new Response(
        JSON.stringify({
          ok: true,
          upload: {
            bucket,
            filePath,
            token: uploadData.token,
            signedUrl: uploadData.signedUrl,
          },
        }),
        { status: 200, headers },
      );
    }

    if (action === "latestVersion") {
      const adminToken = Deno.env.get("OTA_ADMIN_TOKEN") ?? "";
      const sentToken = req.headers.get("x-ota-admin-token") ?? "";

      if (!adminToken || sentToken !== adminToken) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
      }

      const channel = (body?.channel === "beta" ? "beta" : "production") as Channel;
      const platform = (body?.platform === "android" || body?.platform === "ios" ? body.platform : "all") as Platform;

      const { data, error } = await supabase
        .from("ota_releases")
        .select("bundle_version")
        .eq("enabled", true)
        .eq("channel", channel)
        .in("platform", platform === "all" ? ["all"] : [platform, "all"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
      }

      return new Response(
        JSON.stringify({
          ok: true,
          latestVersion: data?.bundle_version ?? "0.0.0",
          channel,
          platform,
        }),
        { status: 200, headers },
      );
    }

    if (action === "publish") {
      const adminToken = Deno.env.get("OTA_ADMIN_TOKEN") ?? "";
      const sentToken = req.headers.get("x-ota-admin-token") ?? "";

      if (!adminToken || sentToken !== adminToken) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
      }

      const channel = (body?.channel === "beta" ? "beta" : "production") as Channel;
      const platform = (body?.platform === "android" || body?.platform === "ios" ? body.platform : "all") as Platform;
      const bundleVersion = typeof body?.bundleVersion === "string" ? body.bundleVersion.trim() : "";
      const filePath = typeof body?.filePath === "string" ? body.filePath.trim() : "";

      if (!bundleVersion || !filePath) {
        return new Response(
          JSON.stringify({ error: "bundleVersion and filePath are required" }),
          { status: 400, headers },
        );
      }

      const rolloutPercent = Number.isFinite(Number(body?.rolloutPercent))
        ? Math.min(Math.max(Number(body.rolloutPercent), 1), 100)
        : 100;

      const payload = {
        channel,
        platform,
        bundle_version: bundleVersion,
        file_path: filePath,
        checksum: typeof body?.checksum === "string" ? body.checksum : null,
        mandatory: Boolean(body?.mandatory),
        enabled: body?.enabled !== false,
        rollout_percent: rolloutPercent,
        native_min_version: typeof body?.nativeMinVersion === "string" ? body.nativeMinVersion : null,
        native_max_version: typeof body?.nativeMaxVersion === "string" ? body.nativeMaxVersion : null,
        metadata: typeof body?.metadata === "object" && body?.metadata !== null ? body.metadata : {},
      };

      const { data, error } = await supabase
        .from("ota_releases")
        .insert(payload)
        .select("id, channel, platform, bundle_version, file_path, created_at")
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
      }

      return new Response(JSON.stringify({ ok: true, release: data }), { status: 201, headers });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unexpected error" }),
      { status: 500, headers },
    );
  }
});
