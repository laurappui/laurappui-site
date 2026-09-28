import {isAdmin} from './_admin-auth.js';
function csv(v){const s=String(v??'');return '"'+s.replaceAll('"','""')+'"'}
export async function onRequestGet({request,env}){
 if(!await isAdmin(request,env)) return new Response('Non autorisé',{status:401});
 if(!env.DB) return new Response('Base D1 non configurée',{status:503});
 const r=await env.DB.prepare('SELECT id,customer_name,customer_email,offer_label,amount_total,currency,paid_at,stripe_session_id FROM payments ORDER BY datetime(paid_at) DESC').all();
 const rows=[['Référence','Client','E-mail','Prestation','Montant EUR','Date paiement','Session Stripe']];
 for(const p of r.results||[]) rows.push([`REC-${String(p.id).padStart(6,'0')}`,p.customer_name,p.customer_email,p.offer_label,(Number(p.amount_total)/100).toFixed(2),p.paid_at,p.stripe_session_id]);
 const out='\ufeff'+rows.map(x=>x.map(csv).join(';')).join('\r\n');
 return new Response(out,{headers:{'content-type':'text/csv; charset=utf-8','content-disposition':'attachment; filename="paiements-laurappui.csv"','cache-control':'no-store'}});
}
