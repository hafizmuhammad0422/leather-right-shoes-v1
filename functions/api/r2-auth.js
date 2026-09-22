const COOKIE_NAME = "lrs_r2_session";
const SESSION_TTL_SECONDS = 12 * 60 * 60;

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {status, headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store",...extraHeaders}});
}
function sameOrigin(request){
  const origin=request.headers.get("Origin");
  if(!origin) return true;
  try { const a=new URL(origin), b=new URL(request.url); return a.protocol===b.protocol && a.host===b.host; } catch { return false; }
}
function constantTimeEqual(a,b){
  const enc=new TextEncoder(), x=enc.encode(String(a||"")), y=enc.encode(String(b||""));
  const n=Math.max(x.length,y.length); let d=x.length^y.length;
  for(let i=0;i<n;i++) d|=(x[i]||0)^(y[i]||0);
  return d===0;
}
function b64url(bytes){
  let s=""; for(const b of bytes) s+=String.fromCharCode(b);
  return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");
}
async function sign(secret, value){
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  return b64url(new Uint8Array(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(value))));
}
function cookieValue(request){
  const raw=request.headers.get("Cookie")||"";
  for(const part of raw.split(";")){ const i=part.indexOf("="); if(i<0) continue; if(part.slice(0,i).trim()===COOKIE_NAME) return part.slice(i+1).trim(); }
  return "";
}
async function validSession(env,request){
  const secret=env?.R2_SESSION_SECRET; if(!secret) return false;
  const token=cookieValue(request); const p=token.split("."); if(p.length!==3) return false;
  const [exp,nonce,sig]=p; const n=Number(exp); if(!Number.isFinite(n)||n<=Math.floor(Date.now()/1000)) return false;
  const expected=await sign(secret,`${exp}.${nonce}`); return constantTimeEqual(sig,expected);
}
function cookie(token,maxAge){
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}
export async function onRequest({request,env}){
  if(!sameOrigin(request)) return json({error:"Cross-origin requests are not allowed."},403);
  const method=request.method.toUpperCase();
  if(method==="GET") return json({ok:true,authenticated:await validSession(env,request)});
  if(method==="DELETE") return json({ok:true},200,{"Set-Cookie":cookie("",0)});
  if(method!=="POST") return new Response("Method Not Allowed",{status:405,headers:{Allow:"GET, POST, DELETE","Cache-Control":"no-store"}});
  if(typeof env?.R2_UPLOAD_PASSWORD!=="string"||!env.R2_UPLOAD_PASSWORD||typeof env?.R2_SESSION_SECRET!=="string"||env.R2_SESSION_SECRET.length<32){
    return json({error:"Image upload session is not configured."},503);
  }
  let body; try{body=await request.json();}catch{return json({error:"Invalid request."},400);}
  if(!constantTimeEqual(body?.password||"",env.R2_UPLOAD_PASSWORD)) return json({error:"Incorrect image upload password."},401);
  const exp=Math.floor(Date.now()/1000)+SESSION_TTL_SECONDS;
  const nonce=crypto.randomUUID(); const sig=await sign(env.R2_SESSION_SECRET,`${exp}.${nonce}`);
  return json({ok:true,expiresIn:SESSION_TTL_SECONDS},200,{"Set-Cookie":cookie(`${exp}.${nonce}.${sig}`,SESSION_TTL_SECONDS)});
}
