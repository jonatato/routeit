import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@12.17.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.1";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const getUserIdByCustomer = async (admin: ReturnType<typeof createClient>, customerId: string) => {
  const { data } = await admin
    .from("billing_customers")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return data?.user_id ?? null;
};

const upsertEntitlement = async (
  admin: ReturnType<typeof createClient>,
  userId: string,
  isPro: boolean,
) => {
  await admin.from("user_entitlements").upsert({
    user_id: userId,
    plan: isPro ? "pro" : "free",
    updated_at: new Date().toISOString(),
  });
};

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  if (!stripeSecretKey || !webhookSecret || !supabaseUrl || !supabaseServiceRoleKey) {
    return jsonResponse({ error: "Missing server configuration" }, 500);
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return jsonResponse({ error: "Missing signature" }, 400);
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Invalid signature" }, 400);
  }

  const admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });

  try {
    if (event.type.startsWith("customer.subscription.")) {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id;
      if (!customerId) {
        return jsonResponse({ received: true });
      }
      const userId = await getUserIdByCustomer(admin, customerId);
      if (!userId) {
        return jsonResponse({ received: true });
      }

      const priceId = subscription.items.data[0]?.price?.id ?? null;
      await admin.from("billing_subscriptions").upsert({
        user_id: userId,
        stripe_subscription_id: subscription.id,
        price_id: priceId,
        status: subscription.status,
        current_period_end: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null,
        cancel_at_period_end: subscription.cancel_at_period_end ?? false,
        updated_at: new Date().toISOString(),
      }, { onConflict: "stripe_subscription_id" });

      const isPro = subscription.status === "active" || subscription.status === "trialing";
      await upsertEntitlement(admin, userId, isPro);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = typeof session.customer === "string"
        ? session.customer
        : session.customer?.id;
      if (customerId) {
        const userId = await getUserIdByCustomer(admin, customerId);
        if (userId) {
          await upsertEntitlement(admin, userId, true);
        }
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id;
      if (customerId) {
        const userId = await getUserIdByCustomer(admin, customerId);
        if (userId) {
          await upsertEntitlement(admin, userId, false);
        }
      }
    }

    return jsonResponse({ received: true });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Webhook error" }, 500);
  }
});
