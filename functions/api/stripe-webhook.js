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
  const email=(s.customer_details?.email || s.customer_email || '').trim().toLowerCase(), name=(s.customer_details?.name || 'Client Stripe').trim();
  for(const sql of ["ALTER TABLE clients ADD COLUMN source TEXT DEFAULT 'manuel'","ALTER TABLE clients ADD COLUMN updated_at TEXT","ALTER TABLE payments ADD COLUMN client_id INTEGER"]){try{await env.DB.prepare(sql).run()}catch{}}
  let clientId=null;
  if(email){let c=await env.DB.prepare('SELECT id FROM clients WHERE lower(email)=lower(?) LIMIT 1').bind(email).first();if(c){clientId=c.id;await env.DB.prepare("UPDATE clients SET status='actif',source=CASE WHEN source IS NULL THEN 'stripe' ELSE source END,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(clientId).run()}else{const cr=await env.DB.prepare("INSERT INTO clients(type,name,email,phone,status,source,updated_at) VALUES('particulier',?,?,?,'actif','stripe',CURRENT_TIMESTAMP)").bind(name,email,s.customer_details?.phone||'À compléter').run();clientId=cr.meta.last_row_id}}
  await env.DB.prepare(`INSERT OR IGNORE INTO payments
    (stripe_session_id,stripe_payment_intent,receipt_token,customer_email,customer_name,offer_key,offer_label,amount_total,currency,paid_at,client_id)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
    .bind(s.id, s.payment_intent || '', token, email, name, offerKey, offerLabel, s.amount_total || 0, s.currency || 'eur', new Date().toISOString(),clientId).run();
  return new Response('ok');
}
