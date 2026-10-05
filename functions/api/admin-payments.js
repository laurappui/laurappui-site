import {isAdmin} from './_admin-auth.js';
async function ensureHidden(env){try{await env.DB.prepare("ALTER TABLE payments ADD COLUMN hidden_from_dashboard INTEGER DEFAULT 0").run()}catch{}}
export async function onRequestGet({request,env}){
 if(!await isAdmin(request,env)) return Response.json({ok:false,error:'Non autorisé'},{status:401});
 if(!env.DB) return Response.json({ok:false,error:'Base D1 non configurée'},{status:503});
 await ensureHidden(env);
 const u=new URL(request.url), q=(u.searchParams.get('q')||'').trim(), limit=Math.min(Number(u.searchParams.get('limit')||100),500);
 let sql='SELECT id,stripe_session_id,receipt_token,customer_email,customer_name,offer_label,amount_total,currency,paid_at,COALESCE(hidden_from_dashboard,0) hidden_from_dashboard FROM payments', binds=[];
 if(q){sql+=' WHERE customer_name LIKE ? OR customer_email LIKE ? OR offer_label LIKE ?'; const x=`%${q}%`;binds=[x,x,x]}
 sql+=' ORDER BY datetime(paid_at) DESC LIMIT ?';binds.push(limit);
 const res=await env.DB.prepare(sql).bind(...binds).all();
 const total=await env.DB.prepare('SELECT COALESCE(SUM(amount_total),0) AS cents, COUNT(*) AS count FROM payments').first();
 const dashboard=await env.DB.prepare('SELECT COALESCE(SUM(amount_total),0) AS cents, COUNT(*) AS count FROM payments WHERE COALESCE(hidden_from_dashboard,0)=0').first();
 return Response.json({ok:true,payments:res.results||[],summary:total,dashboardSummary:dashboard},{headers:{'cache-control':'no-store'}});
}
export async function onRequestPost({request,env}){
 if(!await isAdmin(request,env)) return Response.json({ok:false,error:'Non autorisé'},{status:401});
 if(!env.DB) return Response.json({ok:false,error:'Base D1 non configurée'},{status:503});
 await ensureHidden(env);
 const b=await request.json().catch(()=>null); if(!b||b.action!=='dashboard.visibility') return Response.json({ok:false,error:'Action invalide'},{status:400});
 const id=Number(b.id); if(!id) return Response.json({ok:false,error:'Paiement invalide'},{status:400});
 await env.DB.prepare('UPDATE payments SET hidden_from_dashboard=? WHERE id=?').bind(b.hidden?1:0,id).run();
 return Response.json({ok:true});
}
