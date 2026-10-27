import { describe, expect, it, vi } from 'vitest';
import { buildAttributionRedirect, handleCustomerRegistration } from './http';
const key='blk_demo_'+'a'.repeat(64), token='blc_'+'b'.repeat(64);
const result={id:'a1000000-0000-4000-8000-000000000001',created:true,source:'link'};
function request(body: unknown,headers: Record<string,string>={}) {
  return new Request('https://boostlink.example/api/v1/customers',{method:'POST',headers:{authorization:'Bearer '+key,'content-type':'application/json',...headers},body:JSON.stringify(body)});
}
describe('attribution HTTP boundary',()=>{
  it('passes only validated app-scoped input and returns created versus idempotent responses',async()=>{
    const register=vi.fn().mockResolvedValue({data:result,error:null});
    const response=await handleCustomerRegistration(request({customer_id:'opaque-1',click_tokens:[token]}),register);
    expect(response.status).toBe(201); expect(response.headers.get('cache-control')).toContain('no-store');
    expect(register).toHaveBeenCalledWith({p_api_key:key,p_customer_id:'opaque-1',p_click_tokens:[token],p_code:undefined});
    register.mockResolvedValue({data:{...result,created:false},error:null});
    expect((await handleCustomerRegistration(request({customer_id:'opaque-1'}),register)).status).toBe(200);
  });
  it('rejects app/creator overrides, duplicate tokens, PII-shaped IDs, browser origin and missing credentials before RPC',async()=>{
    const register=vi.fn();
    for(const body of [{customer_id:'x',creator_id:'x'},{customer_id:'x',app_id:'x'},{customer_id:'email@example.test'},{customer_id:'x',click_tokens:[token,token]}]) {
      expect((await handleCustomerRegistration(request(body),register)).status).toBe(400);
    }
    expect((await handleCustomerRegistration(request({customer_id:'x'},{origin:'https://app.example'}),register)).status).toBe(403);
    expect((await handleCustomerRegistration(request({customer_id:'x'},{authorization:''}),register)).status).toBe(401);
    expect(register).not.toHaveBeenCalled();
  });
  it('bounds bodies, returns safe errors, and supports throttling',async()=>{
    const register=vi.fn();
    expect((await handleCustomerRegistration(request({customer_id:'a'.repeat(9000)}),register)).status).toBe(413);
    register.mockResolvedValue({data:null,error:{message:'expired_click_token'}});
    expect(await (await handleCustomerRegistration(request({customer_id:'x',click_tokens:[token]}),register)).json()).toEqual({error:'expired_click_token'});
    register.mockResolvedValue({data:null,error:{message:'secret database contents'}});
    expect(await (await handleCustomerRegistration(request({customer_id:'x'}),register)).json()).toEqual({error:'registration_unavailable'});
    register.mockResolvedValue({data:{error:'rate_limited'},error:null});
    expect((await handleCustomerRegistration(request({customer_id:'x'}),register)).status).toBe(429);
  });
  it('reports a funding pause as a conflict instead of a server outage',async()=>{
    const register=vi.fn().mockResolvedValue({data:null,error:{message:'program_paused_funding'}});
    const response=await handleCustomerRegistration(request({customer_id:'new_customer'}),register);
    expect(response.status).toBe(409);expect(await response.json()).toEqual({error:'program_paused_funding'});
  });
  it('redirects only to HTTPS approved targets, replaces reserved token and keeps store links clean',()=>{
    expect(buildAttributionRedirect('https://app.example/signup?x=1&bl_ref=old#start','website',token)).toBe(`https://app.example/signup?x=1&bl_ref=${token}#start`);
    expect(buildAttributionRedirect('https://apps.apple.com/app/id1','ios_store',null)).toBe('https://apps.apple.com/app/id1');
    for(const destination of ['https://user:pass@app.example','//evil.example','javascript:alert(1)','http://app.example','https://app.example\\@evil.example','https://app.example/\nheader']) {
      expect(()=>buildAttributionRedirect(destination,'website',token)).toThrow();
    }
    expect(()=>buildAttributionRedirect('https://app.example','website','share-token')).toThrow();
  });
});
