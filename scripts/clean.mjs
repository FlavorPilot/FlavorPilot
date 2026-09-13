import {rmSync} from 'node:fs';
for(const path of ['apps/api/dist','apps/web/.next','packages/contracts/dist','packages/flavor-engine/dist','.core-test'])rmSync(path,{recursive:true,force:true});
