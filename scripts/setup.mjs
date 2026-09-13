/** Creates missing local .env files from safe templates. Never overwrites existing credentials. */
import {existsSync,copyFileSync} from 'node:fs';
for(const [source,destination] of [['apps/web/.env.example','apps/web/.env.local'],['apps/api/.env.example','apps/api/.env']]){
 if(existsSync(destination))console.log(`Kept ${destination}`);else{copyFileSync(source,destination);console.log(`Created ${destination}`);}
}
console.log('Guest mode needs no external keys. Run npm run dev. Configure Supabase only to test cloud data.');
