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

async function createJWT(payload, secret) {
  const enc = (obj) => btoa(JSON.stringify(obj)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const header = { alg: "HS256", typ: "JWT" };
  const data = `${enc(header)}.${enc(payload)}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${data}.${sigB64}`;
}

async function verifyJWT(token, secret) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const data = `${parts[0]}.${parts[1]}`;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const sigBytes = Uint8Array.from(
      atob(parts[2].replace(/-/g, "+").replace(/_/g, "/")),
      (c) => c.charCodeAt(0)
    );
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, new TextEncoder().encode(data));
    if (!valid) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (payload.exp && payload.exp < Date.now() / 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

async function hashPassword(password) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  let body;
  try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  const { action } = body;
  const kv = env.SAGE_KV;
  const jwtSecret = env.JWT_SECRET || "change-me-in-production";

  if (action === "google-init") {
    const clientId = env.GOOGLE_CLIENT_ID;
    console.log("[auth] google-init: GOOGLE_CLIENT_ID =", clientId);

    const redirectUri = "https://livewithsage.app/auth/callback";
    const state = crypto.randomUUID();
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
    });
    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    console.log("[auth] google-init: redirect_uri =", redirectUri, "| url length =", url.length);
    return json({ url, state });
  }

  if (action === "google-callback") {
    const { code } = body;
    if (!code) return json({ error: "Missing code" }, 400);
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID || "",
        client_secret: env.GOOGLE_CLIENT_SECRET || "",
        redirect_uri: "https://livewithsage.app/auth/callback",
        grant_type: "authorization_code",
      }),
    });
    const tokens = await tokenRes.json();
    if (tokens.error) return json({ error: tokens.error_description || tokens.error }, 400);

    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const googleUser = await userRes.json();

    const userKey = `user:${googleUser.email}`;
    let user = JSON.parse((await kv.get(userKey)) || "null");
    if (!user) {
      user = {
        id: crypto.randomUUID(),
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
        createdAt: new Date().toISOString(),
      };
      await kv.put(userKey, JSON.stringify(user));
    }
    const token = await createJWT(
      { sub: user.id, email: user.email, exp: Math.floor(Date.now() / 1000) + 30 * 24 * 3600 },
      jwtSecret
    );
    return json({ token, user: { id: user.id, email: user.email, name: user.name, picture: user.picture } });
  }

  if (action === "email-signup") {
    const { email, password, name } = body;
    if (!email || !password || !name) return json({ error: "Missing fields" }, 400);
    const userKey = `user:${email}`;
    if (await kv.get(userKey)) return json({ error: "Account already exists" }, 400);
    const user = {
      id: crypto.randomUUID(),
      email,
      name,
      picture: null,
      passwordHash: await hashPassword(password),
      createdAt: new Date().toISOString(),
    };
    await kv.put(userKey, JSON.stringify(user));
    const token = await createJWT(
      { sub: user.id, email, exp: Math.floor(Date.now() / 1000) + 30 * 24 * 3600 },
      jwtSecret
    );
    return json({ token, user: { id: user.id, email, name, picture: null } });
  }

  if (action === "email-login") {
    const { email, password } = body;
    if (!email || !password) return json({ error: "Missing fields" }, 400);
    const stored = JSON.parse((await kv.get(`user:${email}`)) || "null");
    if (!stored) return json({ error: "Account not found" }, 400);
    if ((await hashPassword(password)) !== stored.passwordHash) return json({ error: "Incorrect password" }, 400);
    const token = await createJWT(
      { sub: stored.id, email, exp: Math.floor(Date.now() / 1000) + 30 * 24 * 3600 },
      jwtSecret
    );
    return json({ token, user: { id: stored.id, email, name: stored.name, picture: stored.picture || null } });
  }

  if (action === "verify-token") {
    const { token } = body;
    if (!token) return json({ valid: false }, 400);
    const payload = await verifyJWT(token, jwtSecret);
    if (!payload) return json({ valid: false });
    const stored = JSON.parse((await kv.get(`user:${payload.email}`)) || "null");
    if (!stored) return json({ valid: false });
    return json({ valid: true, user: { id: stored.id, email: stored.email, name: stored.name, picture: stored.picture || null } });
  }

  if (action === "save-data") {
    const { token, data } = body;
    if (!token || !data) return json({ error: "Missing fields" }, 400);
    const payload = await verifyJWT(token, jwtSecret);
    if (!payload) return json({ error: "Invalid token" }, 401);
    await kv.put(`data:${payload.sub}`, JSON.stringify(data));
    return json({ success: true });
  }

  if (action === "load-data") {
    const { token } = body;
    if (!token) return json({ error: "Missing token" }, 400);
    const payload = await verifyJWT(token, jwtSecret);
    if (!payload) return json({ error: "Invalid token" }, 401);
    const raw = await kv.get(`data:${payload.sub}`);
    return json({ data: raw ? JSON.parse(raw) : null });
  }

  return json({ error: "Unknown action" }, 400);
}
