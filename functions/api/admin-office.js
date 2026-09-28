import {isAdmin} from './_admin-auth.js';
const bad=(e,s=400)=>Response.json({ok:false,error:e},{status:s});
async function ensureClientColumns(env){for(const sql of ["ALTER TABLE clients ADD COLUMN siret TEXT","ALTER TABLE clients ADD COLUMN vat_number TEXT","ALTER TABLE clients ADD COLUMN postal_code TEXT","ALTER TABLE clients ADD COLUMN city TEXT","ALTER TABLE clients ADD COLUMN country TEXT","ALTER TABLE clients ADD COLUMN source TEXT DEFAULT 'manuel'","ALTER TABLE clients ADD COLUMN updated_at TEXT"]){try{await env.DB.prepare(sql).run()}catch{}}}
async function ensureDocColumns(env){for(const sql of ["ALTER TABLE documents ADD COLUMN payment_plan TEXT","ALTER TABLE documents ADD COLUMN quote_date TEXT"]){try{await env.DB.prepare(sql).run()}catch{}}}
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
 if(section==='clients'){await ensureClientColumns(env);const r=await env.DB.prepare('SELECT * FROM clients ORDER BY id DESC').all();return Response.json({ok:true,items:r.results||[]})}
 if(section==='client-detail'){
  await ensureClientColumns(env); const id=Number(u.searchParams.get('id')); if(!id)return bad('Client invalide');
  const client=await env.DB.prepare('SELECT * FROM clients WHERE id=?').bind(id).first(); if(!client)return bad('Client introuvable',404);
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS abby_invoices (id INTEGER PRIMARY KEY AUTOINCREMENT, client_id INTEGER, abby_number TEXT NOT NULL, label TEXT NOT NULL, amount_cents INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'a-facturer', issue_date TEXT, due_date TEXT, payment_method TEXT, abby_url TEXT, notes TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(client_id) REFERENCES clients(id))`).run();
  const [documents,abby,tasks,payments]=await Promise.all([
   env.DB.prepare('SELECT d.*,c.name client_name FROM documents d LEFT JOIN clients c ON c.id=d.client_id WHERE d.client_id=? ORDER BY d.id DESC').bind(id).all(),
   env.DB.prepare('SELECT * FROM abby_invoices WHERE client_id=? ORDER BY id DESC').bind(id).all(),
   env.DB.prepare('SELECT * FROM tasks WHERE client_id=? ORDER BY id DESC').bind(id).all(),
   env.DB.prepare('SELECT * FROM payments WHERE lower(customer_email)=lower(?) ORDER BY datetime(paid_at) DESC').bind(client.email||'').all()
  ]);
  return Response.json({ok:true,client,documents:documents.results||[],abby:abby.results||[],tasks:tasks.results||[],payments:payments.results||[]});
 }
 if(section==='documents'){
  await ensureDocColumns(env);
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS abby_invoices (id INTEGER PRIMARY KEY AUTOINCREMENT, client_id INTEGER, abby_number TEXT NOT NULL, label TEXT NOT NULL, amount_cents INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'a-facturer', issue_date TEXT, due_date TEXT, payment_method TEXT, abby_url TEXT, notes TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(client_id) REFERENCES clients(id))`).run();
  const [r,a]=await Promise.all([
   env.DB.prepare("SELECT d.*,c.name client_name FROM documents d LEFT JOIN clients c ON c.id=d.client_id WHERE d.kind='devis' ORDER BY d.id DESC").all(),
   env.DB.prepare("SELECT a.*,c.name client_name FROM abby_invoices a LEFT JOIN clients c ON c.id=a.client_id ORDER BY a.id DESC").all()
  ]);return Response.json({ok:true,items:r.results||[],abby:a.results||[]})}

 if(section==='tasks'){const r=await env.DB.prepare("SELECT t.*,c.name client_name FROM tasks t LEFT JOIN clients c ON c.id=t.client_id ORDER BY CASE WHEN due_date IS NULL THEN 1 ELSE 0 END,due_date,id DESC").all();return Response.json({ok:true,items:r.results||[]})}
 return bad('Section inconnue');
}
export async function onRequestPost({request,env}){
 if(!await auth(request,env)) return bad('Non autorisé',401); if(!env.DB)return bad('Base D1 non configurée',503);
 const b=await request.json().catch(()=>null); if(!b)return bad('Données invalides');
 if(b.action==='client.create'){
  if(!String(b.name||'').trim())return bad('Nom obligatoire');
  await ensureClientColumns(env);
  const type=b.type==='professionnel'?'professionnel':'particulier';
  if(type==='professionnel'&&!String(b.company||'').trim())return bad('Raison sociale obligatoire pour un professionnel');
  const siret=String(b.siret||'').replace(/\s/g,'');
  if(siret&&!/^\d{14}$/.test(siret))return bad('SIRET : renseignez 14 chiffres ou laissez le champ vide');
  if(!String(b.email||'').trim())return bad('E-mail obligatoire');
  if(!String(b.phone||'').trim())return bad('Téléphone obligatoire');
  const status=['prospect','actif','ancien','archive'].includes(b.status)?b.status:'actif'; const r=await env.DB.prepare('INSERT INTO clients(type,name,company,email,phone,address,notes,siret,vat_number,postal_code,city,country,status,source,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)').bind(type,b.name.trim(),type==='professionnel'?(b.company||'').trim():'',b.email||'',b.phone||'',b.address||'',b.notes||'',type==='professionnel'?siret:'',type==='professionnel'?(b.vat_number||'').trim():'',b.postal_code||'',b.city||'',b.country||'France',status,'manuel').run(); return Response.json({ok:true,id:r.meta.last_row_id});
 }
 if(b.action==='client.update'){
  await ensureClientColumns(env); const id=Number(b.id); if(!id)return bad('Client invalide');
  const type=b.type==='professionnel'?'professionnel':'particulier', siret=String(b.siret||'').replace(/\s/g,'');
  if(!String(b.name||'').trim()||!String(b.email||'').trim()||!String(b.phone||'').trim())return bad('Nom, e-mail et téléphone obligatoires');
  if(type==='professionnel'&&!String(b.company||'').trim())return bad('Raison sociale obligatoire pour un professionnel'); if(siret&&!/^\d{14}$/.test(siret))return bad('SIRET invalide');
  const status=['prospect','actif','ancien','archive'].includes(b.status)?b.status:'actif';
  await env.DB.prepare('UPDATE clients SET type=?,name=?,company=?,email=?,phone=?,address=?,notes=?,siret=?,vat_number=?,postal_code=?,city=?,country=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(type,b.name.trim(),type==='professionnel'?(b.company||'').trim():'',b.email.trim(),b.phone.trim(),b.address||'',b.notes||'',type==='professionnel'?siret:'',type==='professionnel'?(b.vat_number||'').trim():'',b.postal_code||'',b.city||'',b.country||'France',status,id).run(); return Response.json({ok:true});
 }
 if(b.action==='client.delete'){
  const id=Number(b.id); if(!id)return bad('Client invalide'); const c=await env.DB.prepare('SELECT email FROM clients WHERE id=?').bind(id).first(); if(!c)return bad('Client introuvable');
  const [d,t,ai,pay]=await Promise.all([env.DB.prepare('SELECT COUNT(*) n FROM documents WHERE client_id=?').bind(id).first(),env.DB.prepare('SELECT COUNT(*) n FROM tasks WHERE client_id=?').bind(id).first(),env.DB.prepare('SELECT COUNT(*) n FROM abby_invoices WHERE client_id=?').bind(id).first(),env.DB.prepare('SELECT COUNT(*) n FROM payments WHERE lower(customer_email)=lower(?)').bind(c.email||'').first()]);
  if((d?.n||0)+(t?.n||0)+(ai?.n||0)+(pay?.n||0)>0)return bad('Cette fiche possède un historique. Passez-la en « Archivé » au lieu de la supprimer.'); await env.DB.prepare('DELETE FROM clients WHERE id=?').bind(id).run(); return Response.json({ok:true});
 }
 if(b.action==='document.create'){
  await ensureDocColumns(env);
  if(b.kind!=='devis')return bad('Les factures officielles doivent être créées dans Abby.');
  const prefix=b.kind==='devis'?'DEV':'FAC', year=new Date().getFullYear();
  const row=await env.DB.prepare('SELECT COALESCE(MAX(id),0)+1 n FROM documents').first(); const number=`${prefix}-${year}-${String(row.n).padStart(4,'0')}`;
  const r=await env.DB.prepare('INSERT INTO documents(kind,number,client_id,label,amount_cents,status,due_date,notes,payment_plan,quote_date) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(b.kind,number,b.client_id||null,b.label||'Prestation Laur’Appui',Math.round(Number(b.amount||0)*100),b.status||'brouillon',b.due_date||null,b.notes||'',b.payment_plan||'comptant',b.quote_date||null).run(); return Response.json({ok:true,id:r.meta.last_row_id,number});
 }
 if(b.action==='abby.invoice.create'){
  if(!String(b.abby_number||'').trim())return bad('Numéro de facture Abby obligatoire');
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS abby_invoices (id INTEGER PRIMARY KEY AUTOINCREMENT, client_id INTEGER, abby_number TEXT NOT NULL, label TEXT NOT NULL, amount_cents INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'a-facturer', issue_date TEXT, due_date TEXT, payment_method TEXT, abby_url TEXT, notes TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(client_id) REFERENCES clients(id))`).run();
  const r=await env.DB.prepare('INSERT INTO abby_invoices(client_id,abby_number,label,amount_cents,status,issue_date,due_date,payment_method,abby_url,notes) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(b.client_id||null,b.abby_number.trim(),b.label||'Prestation Laur’Appui',Math.round(Number(b.amount||0)*100),b.status||'envoyee',b.issue_date||null,b.due_date||null,b.payment_method||'',b.abby_url||'',b.notes||'').run();
  return Response.json({ok:true,id:r.meta.last_row_id});
 }
 if(b.action==='task.create'){
  if(!String(b.title||'').trim())return bad('Titre obligatoire'); const r=await env.DB.prepare('INSERT INTO tasks(client_id,title,due_date,priority) VALUES(?,?,?,?)').bind(b.client_id||null,b.title.trim(),b.due_date||null,b.priority||'normale').run();return Response.json({ok:true,id:r.meta.last_row_id});
 }
 if(b.action==='status'){
  const tables={client:'clients',document:'documents',task:'tasks'};const table=tables[b.entity];if(!table)return bad('Entité invalide');
  if(b.entity==='document'&&b.status==='a-facturer-abby'){
   await ensureClientColumns(env);
   const row=await env.DB.prepare('SELECT c.type,c.siret,c.company FROM documents d LEFT JOIN clients c ON c.id=d.client_id WHERE d.id=?').bind(b.id).first();
   if(!row)return bad('Devis introuvable');
   if(row.type==='professionnel'&&!/^\d{14}$/.test(String(row.siret||'').replace(/\s/g,'')))return bad('SIRET du client professionnel à compléter avant facturation Abby');
  }
  await env.DB.prepare(`UPDATE ${table} SET status=? WHERE id=?`).bind(b.status,b.id).run();return Response.json({ok:true});
 }
 return bad('Action inconnue');
}
