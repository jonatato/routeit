import "jsr:@supabase/functions-js/edge-runtime.d.ts";

type ResolveResponse = {
  url?: string;
  lat?: number;
  lng?: number;
};

const parseGoogleMapsCoords = (input: string) => {
  const value = input.trim();
  if (!value) return null;
  const decoded = decodeURIComponent(value);
  const patterns = [
    /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /q=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /ll=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /center=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
    /(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
  ];
  for (const pattern of patterns) {
    const match = decoded.match(pattern);
    if (match) {
      const lat = Number(match[1]);
      const lng = Number(match[2]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { lat, lng };
      }
    }
  }
  return null;
};

const parseCoordsFromHtml = (html: string) => {
  const jsonMatch = html.match(/"lat":\s*(-?\d+(?:\.\d+)?),\s*"lng":\s*(-?\d+(?:\.\d+)?)/);
  if (jsonMatch) {
    return { lat: Number(jsonMatch[1]), lng: Number(jsonMatch[2]) };
  }
  const atMatch = html.match(/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
  if (atMatch) {
    return { lat: Number(atMatch[1]), lng: Number(atMatch[2]) };
  }
  const centerMatch = html.match(/"center"\s*:\s*\[\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\]/);
  if (centerMatch) {
    return { lat: Number(centerMatch[1]), lng: Number(centerMatch[2]) };
  }
  const urlMatch = html.match(/https:\/\/www\.google\.com\/maps[^\s"']+/);
  if (urlMatch) {
    return parseGoogleMapsCoords(urlMatch[0]);
  }
  return null;
};

const extractPlaceQuery = (input: string) => {
  try {
    const url = new URL(input);
    const parts = url.pathname.split("/").filter(Boolean);
    const placeIndex = parts.findIndex(part => part === "place");
    if (placeIndex >= 0 && parts[placeIndex + 1]) {
      return decodeURIComponent(parts[placeIndex + 1].replace(/\+/g, " "));
    }
    return null;
  } catch {
    return null;
  }
};

const geocodePlace = async (query: string) => {
  const params = new URLSearchParams({
    q: query,
    format: "json",
    limit: "1",
  });
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: {
      "User-Agent": "routeit-resolve-maps/1.0",
    },
  });
  if (!response.ok) return null;
  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  const first = data[0];
  const lat = Number(first.lat);
  const lng = Number(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
};

const buildFallbackQueries = (query: string) => {
  const parts = query.split(",").map(part => part.trim()).filter(Boolean);
  if (parts.length <= 1) return [query];
  const first = parts[0];
  const tail = parts.slice(-2).join(" ");
  const city = parts.find(part => /beijing|pekin|peking/i.test(part)) ?? parts[parts.length - 2];
  return [
    query,
    `${first} ${city ?? ""}`.trim(),
    `${first} ${tail}`.trim(),
  ].filter(Boolean);
};

const allowedOrigins = new Set([
  "https://routeit.vercel.app",
  "http://localhost:5173",
]);

const corsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin ?? "https://routeit.vercel.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
});

const isAllowedOrigin = (origin: string | null) => {
  if (!origin) return false;
  return allowedOrigins.has(origin);
};

const isAllowedMapsUrl = (input: string) => {
  try {
    const url = new URL(input);
    const host = url.hostname.toLowerCase();
    return (
      host.endsWith("google.com") ||
      host.endsWith("maps.app.goo.gl") ||
      host.endsWith("goo.gl")
    );
  } catch {
    return false;
  }
};

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
    const { url } = await req.json();
    if (typeof url !== "string" || url.trim() === "") {
      return new Response(JSON.stringify({ error: "Missing url" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...headers },
      });
    }
    if (!isAllowedMapsUrl(url)) {
      return new Response(JSON.stringify({ error: "URL not allowed" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...headers },
      });
    }
    const response = await fetch(url, { redirect: "follow" });
    const finalUrl = response.url || url;
    const text = await response.text();
    let coords = parseGoogleMapsCoords(finalUrl) ?? parseCoordsFromHtml(text);
    if (!coords) {
      const placeQuery = extractPlaceQuery(finalUrl);
      if (placeQuery) {
        const queries = buildFallbackQueries(placeQuery);
        for (const q of queries) {
          coords = await geocodePlace(q);
          if (coords) break;
        }
      }
    }
    const body: ResolveResponse = {
      url: finalUrl,
      lat: coords?.lat,
      lng: coords?.lng,
    };
    return new Response(JSON.stringify(body), {
      headers: { "Content-Type": "application/json", ...headers },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...headers } },
    );
  }
});
