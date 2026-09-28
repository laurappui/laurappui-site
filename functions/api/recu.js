function esc(s='') { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
export async function onRequestGet({ request, env }) {
  if (!env.DB) return new Response('Configuration incomplète', {status:503});
  const u = new URL(request.url), token = u.searchParams.get('token');
  if (!token) return new Response('Justificatif introuvable', {status:404});
  const p = await env.DB.prepare('SELECT * FROM payments WHERE receipt_token=?').bind(token).first();
  if (!p) return new Response('Justificatif introuvable', {status:404});
  const euros = (Number(p.amount_total)/100).toLocaleString('fr-FR',{style:'currency',currency:(p.currency||'eur').toUpperCase()});
  const date = new Date(p.paid_at).toLocaleDateString('fr-FR');
  const ref = `REC-${String(p.id).padStart(6,'0')}`;
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Justificatif ${ref} — Laur’Appui</title><style>
  body{font-family:Arial,sans-serif;color:#073b59;background:#f7f0e5;margin:0;padding:30px}.sheet{max-width:760px;margin:auto;background:#fff;padding:42px;border-radius:18px;box-shadow:0 8px 30px #0001}.brand{font-family:Georgia,serif;font-size:30px;font-weight:700}.gold{color:#9b6b2f}.line{border-top:2px solid #c78f45;margin:20px 0}.row{display:flex;justify-content:space-between;gap:20px;padding:10px 0;border-bottom:1px solid #ddd}.total{font-size:24px;font-weight:700}.note{font-size:13px;color:#5c6770;margin-top:28px}.print{margin:20px auto;display:block;padding:12px 20px}@media print{body{background:#fff;padding:0}.sheet{box-shadow:none;border-radius:0}.print{display:none}}</style></head><body><div class="sheet"><div class="brand">Laur’<span class="gold">Appui</span></div><p>Accompagnement administratif & gestion personnalisée</p><div class="line"></div><h1>Justificatif de paiement</h1><div class="row"><b>Référence</b><span>${ref}</span></div><div class="row"><b>Date du paiement</b><span>${date}</span></div><div class="row"><b>Client</b><span>${esc(p.customer_name || '—')}</span></div><div class="row"><b>E-mail</b><span>${esc(p.customer_email || '—')}</span></div><div class="row"><b>Prestation</b><span>${esc(p.offer_label)}</span></div><div class="row total"><b>Montant réglé</b><span>${euros}</span></div><p class="note">Paiement confirmé par le prestataire de paiement. Ce document est un justificatif de règlement. Les mentions légales définitives de Laur’Appui seront ajoutées après validation de l’immatriculation.</p></div><button class="print" onclick="print()">Imprimer / Enregistrer en PDF</button></body></html>`;
  return new Response(html,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
}
