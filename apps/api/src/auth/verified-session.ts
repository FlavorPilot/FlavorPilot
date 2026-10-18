/** Only call AFTER Supabase's /auth/v1/user accepted this exact bearer token.
 * This is claim extraction after remote signature/session verification, not a JWT verifier. */
export function verifiedSessionAssurance(token:string,userId:string,supabaseUrl:string):'aal1'|'aal2'|'unknown' {
    try {
        const parts=token.split('.');
        if(parts.length!==3)return 'unknown';
        const claims:unknown=JSON.parse(Buffer.from(parts[1],'base64url').toString('utf8'));
        if(!claims || typeof claims!=='object')return 'unknown';
        const c=claims as Record<string,unknown>;
        if(c.sub!==userId || c.iss!==`${supabaseUrl}/auth/v1` || typeof c.exp!=='number' || c.exp<=Date.now()/1000)return 'unknown';
        return c.aal==='aal2' ? 'aal2' : c.aal==='aal1' ? 'aal1' : 'unknown';
    } catch {return 'unknown';}
}
