// Laur'Appui — Stripe -> CRM/D1
// Secrets requis : STRIPE_WEBHOOK_SECRET (production) et STRIPE_WEBHOOK_SECRET_TEST (test). Binding D1 : DB.
// Événements Stripe à envoyer : checkout.session.completed et checkout.session.async_payment_succeeded.

function hex(bytes){return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('')}
function timingSafeEqual(a,b){if(a.length!==b.length)return false;let out=0;for(let i=0;i<a.length;i++)out|=a.charCodeAt(i)^b.charCodeAt(i);return out===0}
async function verifyStripeSignature(raw,header,secret){
  if(!header||!secret)return false;
  const values={}; for(const part of header.split(',')){const i=part.indexOf('=');if(i>0) values[part.slice(0,i)]=part.slice(i+1)}
  const timestamp=values.t,signature=values.v1;if(!timestamp||!signature)return false;
  if(Math.abs(Date.now()/1000-Number(timestamp))>300)return false;
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const mac=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(`${timestamp}.${raw}`));
  return timingSafeEqual(hex(mac),signature)
}
const OFFERS={100:['test-paiement','Test paiement Laur’Appui'],9000:['diagnostic','Diagnostic Budget'],18000:['serenite-budget','Sérénité Budget'],36000:['vip-trimestriel','Sérénité VIP — Trimestriel'],110000:['vip-annuel','Sérénité VIP — Annuel']};
export async function onRequestPost({request,env}){
  if(!env.DB||(!env.STRIPE_WEBHOOK_SECRET&&!env.STRIPE_WEBHOOK_SECRET_TEST))return new Response('Configuration incomplète',{status:503});
  const raw=await request.text();
  const signatureHeader=request.headers.get('stripe-signature');
  const validProduction=env.STRIPE_WEBHOOK_SECRET
    ? await verifyStripeSignature(raw,signatureHeader,env.STRIPE_WEBHOOK_SECRET)
    : false;
  const validTest=!validProduction&&env.STRIPE_WEBHOOK_SECRET_TEST
    ? await verifyStripeSignature(raw,signatureHeader,env.STRIPE_WEBHOOK_SECRET_TEST)
    : false;
  if(!validProduction&&!validTest)return new Response('Signature invalide',{status:400});
  let event;try{event=JSON.parse(raw)}catch{return new Response('JSON invalide',{status:400})}
  if(!['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type))return new Response('ok');
  const s=event.data?.object;if(!s||s.payment_status!=='paid')return new Response('ok');

  for(const sql of ["ALTER TABLE clients ADD COLUMN source TEXT DEFAULT 'manuel'","ALTER TABLE clients ADD COLUMN updated_at TEXT","ALTER TABLE payments ADD COLUMN client_id INTEGER","ALTER TABLE payments ADD COLUMN stripe_payment_link TEXT"]){try{await env.DB.prepare(sql).run()}catch{}}
  const email=(s.customer_details?.email||s.customer_email||'').trim().toLowerCase();
  const name=(s.customer_details?.name||'Client Stripe').trim();
  const phone=(s.customer_details?.phone||'').trim();
  let clientId=null;
  if(email){
    const c=await env.DB.prepare('SELECT id FROM clients WHERE lower(email)=lower(?) LIMIT 1').bind(email).first();
    if(c){clientId=c.id;await env.DB.prepare("UPDATE clients SET status='actif',updated_at=CURRENT_TIMESTAMP,phone=CASE WHEN (phone IS NULL OR phone='' OR phone='À compléter') AND ?<>'' THEN ? ELSE phone END WHERE id=?").bind(phone,phone,clientId).run()}
    else{const cr=await env.DB.prepare("INSERT INTO clients(type,name,email,phone,status,source,updated_at) VALUES('particulier',?,?,?,'actif','stripe',CURRENT_TIMESTAMP)").bind(name,email,phone||'À compléter').run();clientId=cr.meta.last_row_id}
  }
  const fallback=OFFERS[Number(s.amount_total)]||['','Prestation Laur’Appui'];
  const offerKey=s.metadata?.offer_key||fallback[0];
  const offerLabel=s.metadata?.offer_label||fallback[1];
  const token=crypto.randomUUID();
  await env.DB.prepare(`INSERT OR IGNORE INTO payments
    (stripe_session_id,stripe_payment_intent,receipt_token,customer_email,customer_name,offer_key,offer_label,amount_total,currency,paid_at,client_id,stripe_payment_link)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
    .bind(s.id,s.payment_intent||'',token,email,name,offerKey,offerLabel,s.amount_total||0,s.currency||'eur',new Date().toISOString(),clientId,s.payment_link||'').run();
  return new Response('ok')
}
