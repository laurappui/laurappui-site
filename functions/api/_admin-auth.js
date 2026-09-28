const enc=new TextEncoder();
function hex(bytes){return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('')}
function safe(a,b){if(a.length!==b.length)return false;let n=0;for(let i=0;i<a.length;i++)n|=a.charCodeAt(i)^b.charCodeAt(i);return n===0}
async function hmac(v,s){const k=await crypto.subtle.importKey('raw',enc.encode(s),{name:'HMAC',hash:'SHA-256'},false,['sign']);return hex(await crypto.subtle.sign('HMAC',k,enc.encode(v)))}
export async function isAdmin(request,env){if(!env.ADMIN_SESSION_SECRET)return false;const m=(request.headers.get('cookie')||'').match(/(?:^|;\s*)laurappui_admin=([^;]+)/);if(!m)return false;const parts=m[1].split('.');if(parts.length!==3||parts[0]!=='admin'||Number(parts[1])<Date.now()/1000)return false;return safe(await hmac(`${parts[0]}.${parts[1]}`,env.ADMIN_SESSION_SECRET),parts[2])}
