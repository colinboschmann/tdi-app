const STRIPE_API = "https://api.stripe.com/v1";

function stripeAuth(secretKey) {
  return "Basic " + btoa(secretKey + ":");
}

async function stripePost(path, params, secretKey) {
  const res = await fetch(`${STRIPE_API}${path}`, {
    method: "POST",
    headers: {
      "Authorization": stripeAuth(secretKey),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params).toString(),
  });
  return res.json();
}

async function stripeGet(path, secretKey) {
  const res = await fetch(`${STRIPE_API}${path}`, {
    headers: { "Authorization": stripeAuth(secretKey) },
  });
  return res.json();
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const secretKey = env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return json({ error: "Stripe not configured" }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { action } = body;

  if (action === "create-checkout") {
    const { customer_email } = body;
    const checkoutParams = {
      "payment_method_types[]": "card",
      "line_items[0][price]": "price_1TYzlXI3TXovAatf7UalyHj3",
      "line_items[0][quantity]": "1",
      "mode": "subscription",
      "success_url": "https://tdi-app.pages.dev?upgraded=true&session_id={CHECKOUT_SESSION_ID}",
      "cancel_url": "https://tdi-app.pages.dev",
    };
    if (customer_email) checkoutParams.customer_email = customer_email;
    const session = await stripePost("/checkout/sessions", checkoutParams, secretKey);

    if (session.error) {
      return json({ error: session.error.message }, 400);
    }
    return json({ url: session.url });
  }

  if (action === "verify-session") {
    const { session_id } = body;
    if (!session_id) {
      return json({ error: "Missing session_id" }, 400);
    }

    const session = await stripeGet(`/checkout/sessions/${session_id}`, secretKey);

    if (session.error) {
      return json({ error: session.error.message }, 400);
    }

    const active = session.payment_status === "paid" || session.status === "complete";
    return json({
      active,
      customerId: session.customer || null,
      subscriptionId: session.subscription || null,
    });
  }

  return json({ error: "Unknown action" }, 400);
}
