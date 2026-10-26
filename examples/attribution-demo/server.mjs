// Local, deliberately minimal sandbox registration app. Not production authentication.
import https from 'node:https';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const api=process.env.BOOSTLINK_API_URL??'http://localhost:3000';
const secret=process.env.BOOSTLINK_APP_API_KEY;
if(!/^blk_demo_[a-f0-9]{64}$/.test(secret??'')) throw new Error('Set BOOSTLINK_APP_API_KEY on the demo server only.');
const certDir=mkdtempSync(join(tmpdir(),'boostlink-demo-'));
execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',join(certDir,'key.pem'),'-out',join(certDir,'cert.pem'),'-days','1','-subj','/CN=demo.localhost','-addext','subjectAltName=DNS:demo.localhost'],{stdio:'ignore'});
const sessions=new Map();
const accounts=new Map();
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const server=https.createServer({key:readFileSync(join(certDir,'key.pem')),cert:readFileSync(join(certDir,'cert.pem'))},async(req,res)=>{
  res.setHeader('Cache-Control','no-store'); res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('Content-Security-Policy',"default-src 'none'; form-action 'self'; frame-ancestors 'none'");
  res.setHeader('X-Content-Type-Options','nosniff');
  const url=new URL(req.url,'https://demo.localhost:3443');
  const cookie=(req.headers.cookie??'').match(/(?:^|; )boostlink_demo=([a-f0-9-]{36})(?:;|$)/)?.[1];
  let session=cookie && sessions.get(cookie);
  if(!session) { const id=randomUUID();session={tokens:[],csrf:randomUUID()};sessions.set(id,session);res.setHeader('Set-Cookie',`boostlink_demo=${id}; Secure; HttpOnly; SameSite=Lax; Path=/`); }
  const token=url.searchParams.get('bl_ref');
  if(req.method==='GET' && token && /^blc_[a-f0-9]{64}$/.test(token)) {
    session.tokens=[...session.tokens.filter(t=>t!==token),token].slice(-10);
    res.writeHead(303,{Location:'/'});res.end();return;
  }
  let result='';
  if(req.method==='POST' && url.pathname==='/register') {
    try {
      let body='';for await(const chunk of req) { body+=chunk; if(Buffer.byteLength(body)>4096) throw new Error(); }
      const form=new URLSearchParams(body);
      if(form.get('csrf')!==session.csrf) { res.writeHead(403);res.end('Invalid form.');return; }
      const handle=form.get('handle')??'';
      if(!/^[A-Za-z0-9_-]{1,40}$/.test(handle)) { res.writeHead(400);res.end('Use an opaque demo account handle.');return; }
      // The app backend owns the real customer ID; a browser never chooses a creator/app ID.
      let customer=accounts.get(handle);
      if(!customer) {customer=randomUUID(); accounts.set(handle,customer);}
      const payload={customer_id:customer,click_tokens:session.tokens};
      const code=form.get('code')?.trim();if(code) payload.code=code;
      const response=await fetch(new URL('/api/v1/customers',api),{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+secret},body:JSON.stringify(payload)});
      const data=await response.json();
      result=`HTTP ${response.status}: ${JSON.stringify(data)}`;
    } catch { result='Registration could not be completed. Check the sandbox server.'; }
  } else if(req.method!=='GET') {res.writeHead(405);res.end();return;}
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.end(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>BoostLink integration demo</title><main><h1>App registration — integration demo</h1><p>Local sandbox only. Account handles are simulated accounts, not production authentication. No email, name or phone is collected.</p><p>Referral receipts held by this app’s server session: ${session.tokens.length}.</p><form method="post" action="/register"><input type="hidden" name="csrf" value="${session.csrf}"><p><label>Opaque demo account handle <input name="handle" required maxlength="40" pattern="[A-Za-z0-9_-]+"></label></p><p><label>Explicit creator code (optional) <input name="code" maxlength="24"></label></p><button>Register / retry same account</button></form><p role="status">${escape(result)}</p><p>Use the same handle again to test idempotency. Accounts/sessions are reset on demo restart; BoostLink’s stored attribution persists.</p></main></html>`);
});
server.listen(3443,'127.0.0.1',()=>console.log('Demo: https://demo.localhost:3443 — temporary self-signed certificate, local use only.'));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>{rmSync(certDir,{recursive:true,force:true});process.exit(0);}));
