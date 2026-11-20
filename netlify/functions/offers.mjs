// Returns the offers only to signed-in users who are approved students, staff, or the owner.
// The user's Firebase ID token is checked by asking Firestore (which rejects invalid tokens)
// for the user's own record, so no secret keys are needed here.
import { OFFERS } from "./offers-data.mjs";
import { PROJECT_ID, OWNER_EMAIL } from "./config.mjs";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

export default async (req) => {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ status: "signed-out" }, 401);

  let claims;
  try {
    claims = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
  } catch {
    return json({ status: "signed-out" }, 401);
  }
  if (claims.aud !== PROJECT_ID) return json({ status: "signed-out" }, 401);
  const uid = claims.user_id || claims.sub;
  if (!uid) return json({ status: "signed-out" }, 401);

  const base = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
  const headers = { Authorization: `Bearer ${token}` };

  // Firestore verifies the token. 401/403 here means it isn't valid.
  const userRes = await fetch(`${base}/users/${encodeURIComponent(uid)}`, { headers });
  if (userRes.status === 401 || userRes.status === 403) return json({ status: "signed-out" }, 401);
  if (userRes.status !== 200 && userRes.status !== 404) return json({ status: "error" }, 502);

  // Token is valid from here on, so its email claim can be trusted.
  const email = String(claims.email || "").toLowerCase();
  const verified = claims.email_verified === true;
  let staff = verified && email === OWNER_EMAIL.toLowerCase();
  if (!staff && verified && email) {
    const s = await fetch(`${base}/staff/${encodeURIComponent(email)}`, { headers });
    staff = s.status === 200;
  }

  let status = "pending";
  if (userRes.status === 200) {
    const doc = await userRes.json();
    status = doc?.fields?.status?.stringValue || "pending";
  }

  if (staff || status === "approved") {
    return json({ status: "approved", staff, owner: verified && email === OWNER_EMAIL.toLowerCase(), offers: OFFERS });
  }
  return json({ status }, 403);
};

export const config = { path: "/api/offers" };
