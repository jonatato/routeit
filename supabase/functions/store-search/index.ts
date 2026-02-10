import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.1";

const siteUrl = Deno.env.get("SITE_URL") ?? "https://routeit.vercel.app";
const allowedOrigins = new Set(
  (Deno.env.get("ALLOWED_ORIGINS") ?? `${siteUrl},http://localhost:5173`)
    .split(",")
    .map(value => value.trim())
    .filter(Boolean),
);

const corsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin ?? siteUrl,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
});

const isAllowedOrigin = (origin: string | null) => {
  if (!origin) return false;
  return allowedOrigins.has(origin);
};

const sanitizeSearch = (value: string) => value.replace(/[%_]/g, match => `\\${match}`);

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers });
  }

  if (!isAllowedOrigin(origin)) {
    return new Response(JSON.stringify({ error: "Origin not allowed" }), {
      status: 403,
      headers: { "Content-Type": "application/json", ...headers },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(JSON.stringify({ error: "Missing server configuration" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...headers },
      });
    }

    const body = await req.json();
    const rawQuery = typeof body?.query === "string" ? body.query.trim() : "";
    const tags = Array.isArray(body?.tags)
      ? body.tags.filter((tag: unknown) => typeof tag === "string" && tag.trim()).map((tag: string) => tag.trim())
      : [];
    const limit = Number.isFinite(body?.limit) ? Math.min(Math.max(Number(body.limit), 1), 50) : 24;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });

    let query = supabase
      .from("store_itineraries")
      .select(
        "id,title,subtitle,preview_summary,preview_price,preview_days,preview_cities,preview_region,preview_tags,preview_highlights,cover_image_url,gallery_image_urls,hook,highlights,who_is_for,what_you_get,duration_days,best_season,difficulty,style_tags,country,regions,cities,pricing_tier,estimated_daily,currency,itinerary_overview,extras,assets",
      )
      .order("title", { ascending: true })
      .limit(limit);

    if (tags.length > 0) {
      query = query.contains("preview_tags", tags);
    }

    if (rawQuery) {
      const search = sanitizeSearch(rawQuery);
      query = query.or(
        `title.ilike.%${search}%,subtitle.ilike.%${search}%,preview_summary.ilike.%${search}%,preview_region.ilike.%${search}%,country.ilike.%${search}%`,
      );
    }

    const { data, error } = await query;
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...headers },
      });
    }

    return new Response(JSON.stringify({ data }), {
      headers: { "Content-Type": "application/json", ...headers },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...headers } },
    );
  }
});
