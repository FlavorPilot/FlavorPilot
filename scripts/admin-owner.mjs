// Operator-only bootstrap. No HTTP endpoint or signup metadata can grant administrative access.
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(path.join(root,'apps/api/package.json'));
const postgres=require('postgres');
const [operation,userId,reason,...flags]=process.argv.slice(2);
if(!['grant','revoke'].includes(operation) || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId ?? '') || !reason?.trim() || reason.trim().length<5 || reason.length>500 || flags.some(f=>f!=='--apply')){
    console.error('Usage: node scripts/admin-owner.mjs grant|revoke USER_UUID "reason of at least 5 characters" [--apply]');process.exit(1);
}
if(!flags.includes('--apply')){console.log(`Dry run: ${operation} owner access for ${userId}. No connection or write made. Add --apply to execute against the API DATABASE_URL.`);process.exit(0);}
if(!process.env.DATABASE_URL){try{process.loadEnvFile(path.join(root,'apps/api/.env'));}catch{console.error('Set DATABASE_URL or configure apps/api/.env.');process.exit(1);}}
if(!process.env.DATABASE_URL){console.error('DATABASE_URL is required.');process.exit(1);}
const host=new URL(process.env.DATABASE_URL).hostname,local=['localhost','127.0.0.1','[::1]','host.docker.internal'].includes(host);
const ssl=process.env.DATABASE_SSL==='disable' ? false : process.env.DATABASE_SSL==='require' ? 'require' : local ? false : 'require';
const sql=postgres(process.env.DATABASE_URL,{max:1,ssl,prepare:false});
try{
    await sql.begin(async tx=>{
        const [profile]=await tx`select id from public.profiles where id=${userId}::uuid for update`;
        if(!profile)throw new Error('PROFILE_MISSING');
        await tx`insert into public.admin_memberships(user_id,role,active) values(${userId}::uuid,'owner',${operation==='grant'}) on conflict(user_id) do update set role='owner',active=excluded.active`;
        await tx`insert into public.admin_audit_events(actor_id,action,target_id,reason) values(null,${`owner.${operation}`},${userId},${reason.trim()})`;
    });
    console.log(`Owner access ${operation==='grant' ? 'granted' : 'revoked'} for ${userId}. Operator action recorded.`);
}catch(error){console.error(error instanceof Error && error.message==='PROFILE_MISSING' ? 'Existing profile not found.' : 'Owner assignment failed. Check connectivity, migration 0010 and database permissions. No credentials are printed.');process.exitCode=1;}
finally{await sql.end({timeout:5});}
