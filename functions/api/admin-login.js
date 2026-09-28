const enc = new TextEncoder();
function hex(bytes){return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('')}
async function hmac(value,secret){const k=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return hex(await crypto.subtle.sign('HMAC',k,enc.encode(value)))}
export async function onRequestPost({request,env}){
  if(!env.ADMIN_PASSWORD || !env.ADMIN_SESSION_SECRET) return Response.json({ok:false,error:'Configuration admin incomplète'},{status:503});
  let body={}; try{body=await request.json()}catch{}
  if(String(body.password||'')!==String(env.ADMIN_PASSWORD)) return Response.json({ok:false,error:'Mot de passe incorrect'},{status:401});
  const exp=Math.floor(Date.now()/1000)+8*3600, payload=`admin.${exp}`, sig=await hmac(payload,env.ADMIN_SESSION_SECRET);
  return new Response(JSON.stringify({ok:true}),{headers:{'content-type':'application/json','set-cookie':`laurappui_admin=${payload}.${sig}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`}});
}
