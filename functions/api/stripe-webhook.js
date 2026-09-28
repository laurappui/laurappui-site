// Laur'Appui — Cloudflare Pages Function
// Reçoit les paiements Stripe et crée un enregistrement D1.
// Secrets requis dans Cloudflare : STRIPE_WEBHOOK_SECRET. Binding D1 requis : DB.

function hex(bytes) {
  return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('');
}
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}
async function verifyStripeSignature(raw, header, secret) {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(header.split(',').map(x => x.split('=')));
  const timestamp = parts.t, signature = parts.v1;
  if (!timestamp || !signature) return false;
  if (Math.abs(Date.now()/1000 - Number(timestamp)) > 300) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), {name:'HMAC', hash:'SHA-256'}, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${raw}`));
  return timingSafeEqual(hex(mac), signature);
}
export async function onRequestPost({ request, env }) {
  if (!env.DB || !env.STRIPE_WEBHOOK_SECRET) return new Response('Configuration incomplète', {status:503});
  const raw = await request.text();
  const sig = request.headers.get('stripe-signature');
  if (!await verifyStripeSignature(raw, sig, env.STRIPE_WEBHOOK_SECRET)) return new Response('Signature invalide', {status:400});
  let event;
  try { event = JSON.parse(raw); } catch { return new Response('JSON invalide', {status:400}); }
  if (event.type !== 'checkout.session.completed') return new Response('ok');
  const s = event.data && event.data.object;
  if (!s || s.payment_status !== 'paid') return new Response('ok');
  const token = crypto.randomUUID();
  const offerKey = s.metadata?.offer_key || '';
  const offerLabel = s.metadata?.offer_label || 'Prestation Laur’Appui';
  await env.DB.prepare(`INSERT OR IGNORE INTO payments
    (stripe_session_id,stripe_payment_intent,receipt_token,customer_email,customer_name,offer_key,offer_label,amount_total,currency,paid_at)
    VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .bind(s.id, s.payment_intent || '', token, s.customer_details?.email || s.customer_email || '', s.customer_details?.name || '', offerKey, offerLabel, s.amount_total || 0, s.currency || 'eur', new Date().toISOString()).run();
  return new Response('ok');
}
