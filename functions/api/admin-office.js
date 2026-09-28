import {isAdmin} from './_admin-auth.js';
const bad=(e,s=400)=>Response.json({ok:false,error:e},{status:s});
async function auth(request,env){return await isAdmin(request,env)}
export async function onRequestGet({request,env}){
 if(!await auth(request,env)) return bad('Non autorisé',401); if(!env.DB)return bad('Base D1 non configurée',503);
 const u=new URL(request.url), section=u.searchParams.get('section')||'dashboard';
 if(section==='dashboard'){
  const [c,d,t,p]=await Promise.all([
   env.DB.prepare("SELECT COUNT(*) n FROM clients WHERE status='actif'").first(),
   env.DB.prepare("SELECT COUNT(*) n,COALESCE(SUM(CASE WHEN status='payee' THEN amount_cents ELSE 0 END),0) paid FROM documents").first(),
   env.DB.prepare("SELECT COUNT(*) n FROM tasks WHERE status!='terminee'").first(),
   env.DB.prepare('SELECT COUNT(*) n,COALESCE(SUM(amount_total),0) cents FROM payments').first()]);
  const recent=await env.DB.prepare("SELECT d.*,c.name client_name FROM documents d LEFT JOIN clients c ON c.id=d.client_id ORDER BY d.id DESC LIMIT 8").all();
  return Response.json({ok:true,metrics:{clients:c.n,documents:d.n,tasks:t.n,payments:p.n,paid:d.paid,stripe:p.cents},recent:recent.results||[]});
 }
 if(section==='clients'){const r=await env.DB.prepare('SELECT * FROM clients ORDER BY id DESC').all();return Response.json({ok:true,items:r.results||[]})}
 if(section==='documents'){const r=await env.DB.prepare("SELECT d.*,c.name client_name FROM documents d LEFT JOIN clients c ON c.id=d.client_id ORDER BY d.id DESC").all();return Response.json({ok:true,items:r.results||[]})}
 if(section==='tasks'){const r=await env.DB.prepare("SELECT t.*,c.name client_name FROM tasks t LEFT JOIN clients c ON c.id=t.client_id ORDER BY CASE WHEN due_date IS NULL THEN 1 ELSE 0 END,due_date,id DESC").all();return Response.json({ok:true,items:r.results||[]})}
 return bad('Section inconnue');
}
export async function onRequestPost({request,env}){
 if(!await auth(request,env)) return bad('Non autorisé',401); if(!env.DB)return bad('Base D1 non configurée',503);
 const b=await request.json().catch(()=>null); if(!b)return bad('Données invalides');
 if(b.action==='client.create'){
  if(!String(b.name||'').trim())return bad('Nom obligatoire');
  const r=await env.DB.prepare('INSERT INTO clients(type,name,company,email,phone,address,notes) VALUES(?,?,?,?,?,?,?)').bind(b.type||'particulier',b.name.trim(),b.company||'',b.email||'',b.phone||'',b.address||'',b.notes||'').run(); return Response.json({ok:true,id:r.meta.last_row_id});
 }
 if(b.action==='document.create'){
  if(!['devis','facture'].includes(b.kind))return bad('Type invalide');
  const prefix=b.kind==='devis'?'DEV':'FAC', year=new Date().getFullYear();
  const row=await env.DB.prepare('SELECT COALESCE(MAX(id),0)+1 n FROM documents').first(); const number=`${prefix}-${year}-${String(row.n).padStart(4,'0')}`;
  const r=await env.DB.prepare('INSERT INTO documents(kind,number,client_id,label,amount_cents,status,due_date,notes) VALUES(?,?,?,?,?,?,?,?)').bind(b.kind,number,b.client_id||null,b.label||'Prestation Laur’Appui',Math.round(Number(b.amount||0)*100),b.status||'brouillon',b.due_date||null,b.notes||'').run(); return Response.json({ok:true,id:r.meta.last_row_id,number});
 }
 if(b.action==='task.create'){
  if(!String(b.title||'').trim())return bad('Titre obligatoire'); const r=await env.DB.prepare('INSERT INTO tasks(client_id,title,due_date,priority) VALUES(?,?,?,?)').bind(b.client_id||null,b.title.trim(),b.due_date||null,b.priority||'normale').run();return Response.json({ok:true,id:r.meta.last_row_id});
 }
 if(b.action==='status'){
  const tables={client:'clients',document:'documents',task:'tasks'};const table=tables[b.entity];if(!table)return bad('Entité invalide'); await env.DB.prepare(`UPDATE ${table} SET status=? WHERE id=?`).bind(b.status,b.id).run();return Response.json({ok:true});
 }
 return bad('Action inconnue');
}
