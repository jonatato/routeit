import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@12.17.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.1";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const siteUrl = Deno.env.get("SITE_URL") ?? "http://localhost:5173";

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

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
    if (!stripeSecretKey || !supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return new Response(JSON.stringify({ error: "Missing server configuration" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...headers },
      });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...headers },
      });
    }

    const { data: customer } = await admin
      .from("billing_customers")
      .select("stripe_customer_id")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (!customer?.stripe_customer_id) {
      return new Response(JSON.stringify({ error: "Customer not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...headers },
      });
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: customer.stripe_customer_id,
      return_url: `${siteUrl}/app/profile`,
    });

    return new Response(JSON.stringify({ url: portal.url }), {
      headers: { "Content-Type": "application/json", ...headers },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...headers } },
    );
  }
});
