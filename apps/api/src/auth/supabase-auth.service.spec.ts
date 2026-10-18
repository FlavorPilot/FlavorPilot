import { afterEach,describe,it,expect,vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { SupabaseAuthService } from './supabase-auth.service';
import { verifiedSessionAssurance } from './verified-session';
const id='aa731c70-950a-4778-937a-b7185e1b4fae',url='https://auth.example.test';
const token=(claims:object)=>`header.${Buffer.from(JSON.stringify({sub:id,iss:`${url}/auth/v1`,exp:Math.floor(Date.now()/1000)+60,aal:'aal2',...claims})).toString('base64url')}.signature`;
afterEach(()=>vi.unstubAllGlobals());
describe('admin session assurance',()=>{
    it('does not trust a claimed aal2 when the auth provider rejects the exact token',async()=>{
        const fetch=vi.fn().mockResolvedValue(new Response('{}',{status:401}));vi.stubGlobal('fetch',fetch);
        const service=new SupabaseAuthService(new ConfigService({SUPABASE_URL:url,SUPABASE_PUBLISHABLE_KEY:'public'}));
        await expect(service.verifyAccessToken(token({}))).rejects.toThrow();
        expect(fetch).toHaveBeenCalledOnce();
    });
    it('extracts assurance only after successful remote validation and matched user identity',async()=>{
        vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({id}),{status:200})));
        const service=new SupabaseAuthService(new ConfigService({SUPABASE_URL:url,SUPABASE_PUBLISHABLE_KEY:'public'}));
        expect((await service.verifyAccessToken(token({}))).assurance).toBe('aal2');
        expect(verifiedSessionAssurance(token({sub:'different'}),id,url)).toBe('unknown');
        expect(verifiedSessionAssurance(token({iss:'wrong'}),id,url)).toBe('unknown');
        expect(verifiedSessionAssurance(token({exp:0}),id,url)).toBe('unknown');
        expect(verifiedSessionAssurance('opaque-test-token',id,url)).toBe('unknown');
    });
});
