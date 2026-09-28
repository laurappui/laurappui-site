import {isAdmin} from './_admin-auth.js';
export async function onRequestGet({request,env}){
 if(!await isAdmin(request,env)) return Response.json({ok:false,error:'Non autorisé'},{status:401});
 return Response.json({ok:true,db:!!env.DB,stripe:!!env.STRIPE_WEBHOOK_SECRET},{headers:{'cache-control':'no-store'}});
}
