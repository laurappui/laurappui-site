async function ensure(env){
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS contact_requests (id INTEGER PRIMARY KEY AUTOINCREMENT, client_id INTEGER, request_type TEXT, offer TEXT, subject TEXT, message TEXT, availability TEXT, preferred_contact TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`).run();
 for(const sql of ["ALTER TABLE clients ADD COLUMN siret TEXT","ALTER TABLE clients ADD COLUMN source TEXT DEFAULT 'manuel'","ALTER TABLE clients ADD COLUMN updated_at TEXT"]){try{await env.DB.prepare(sql).run()}catch{}}
}
export async function onRequestPost({request,env}){
 if(!env.DB)return Response.json({ok:false,error:'Service temporairement indisponible'},{status:503}); const b=await request.json().catch(()=>null); if(!b)return Response.json({ok:false,error:'Données invalides'},{status:400}); if(b.website)return Response.json({ok:true});
 const name=String(b.nom||'').trim(),email=String(b.email||'').trim().toLowerCase(),phone=String(b.telephone||'').trim(); if(!name||!email||!phone)return Response.json({ok:false,error:'Nom, e-mail et téléphone obligatoires'},{status:400});
 await ensure(env); const type=b.profil==='pro'?'professionnel':'particulier', company=type==='professionnel'?String(b.entreprise||'').trim():'', siret=type==='professionnel'?String(b.siret||'').replace(/\s/g,''):''; if(siret&&!/^\d{14}$/.test(siret))return Response.json({ok:false,error:'SIRET invalide'},{status:400});
 let c=await env.DB.prepare('SELECT id FROM clients WHERE lower(email)=lower(?) LIMIT 1').bind(email).first(); let id;
 if(c){id=c.id;await env.DB.prepare("UPDATE clients SET name=?,type=?,company=CASE WHEN ?<>'' THEN ? ELSE company END,phone=?,siret=CASE WHEN ?<>'' THEN ? ELSE siret END,status=CASE WHEN status IN ('ancien','archive') THEN 'prospect' ELSE status END,source=CASE WHEN source IS NULL OR source='manuel' THEN 'site-contact' ELSE source END,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(name,type,company,company,phone,siret,siret,id).run()}
 else {const r=await env.DB.prepare("INSERT INTO clients(type,name,company,email,phone,siret,status,source,updated_at) VALUES(?,?,?,?,?,?,'prospect','site-contact',CURRENT_TIMESTAMP)").bind(type,name,company,email,phone,siret).run();id=r.meta.last_row_id}
 await env.DB.prepare('INSERT INTO contact_requests(client_id,request_type,offer,subject,message,availability,preferred_contact) VALUES(?,?,?,?,?,?,?)').bind(id,b.demande||'',b.offre||'',b.sujet||'',b.message||'',b.disponibilites||'',b.premier_contact||'').run();
 return Response.json({ok:true});
}