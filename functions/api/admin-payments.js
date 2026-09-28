import {isAdmin} from './_admin-auth.js';
export async function onRequestGet({request,env}){
 if(!await isAdmin(request,env)) return Response.json({ok:false,error:'Non autorisé'},{status:401});
 if(!env.DB) return Response.json({ok:false,error:'Base D1 non configurée'},{status:503});
 const u=new URL(request.url), q=(u.searchParams.get('q')||'').trim(), limit=Math.min(Number(u.searchParams.get('limit')||100),500);
 let sql='SELECT id,stripe_session_id,receipt_token,customer_email,customer_name,offer_label,amount_total,currency,paid_at FROM payments', binds=[];
 if(q){sql+=' WHERE customer_name LIKE ? OR customer_email LIKE ? OR offer_label LIKE ?'; const x=`%${q}%`;binds=[x,x,x]}
 sql+=' ORDER BY datetime(paid_at) DESC LIMIT ?';binds.push(limit);
 const res=await env.DB.prepare(sql).bind(...binds).all();
 const total=await env.DB.prepare('SELECT COALESCE(SUM(amount_total),0) AS cents, COUNT(*) AS count FROM payments').first();
 return Response.json({ok:true,payments:res.results||[],summary:total},{headers:{'cache-control':'no-store'}});
}
