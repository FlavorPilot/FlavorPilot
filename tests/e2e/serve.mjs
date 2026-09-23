import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resetTestDatabase } from '../../apps/api/test/reset-database.mjs';
import { startAuthStub } from '../../apps/api/test/auth-stub.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const databaseUrl = process.env.FLAVORPILOT_TEST_DATABASE_URL ?? 'postgres://postgres:postgres@127.0.0.1:54329/flavorpilot_test';
await resetTestDatabase(databaseUrl);
const stub = await startAuthStub({ databaseUrl, port: 54321 });
const api = spawn(process.execPath, ['dist/main.js'], {
    cwd: path.join(root, 'apps/api'),
    stdio: 'inherit',
    env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
        DATABASE_SSL: 'disable',
        SUPABASE_URL: stub.url,
        SUPABASE_PUBLISHABLE_KEY: stub.key,
        AI_ENABLED: 'false',
        NODE_ENV: 'test',
        PORT: '4000',
        API_HOST: '127.0.0.1',
        CORS_ORIGINS: 'http://127.0.0.1:3000,http://localhost:3000',
        SWAGGER_ENABLED: 'false',
    },
});
function shutdown() {
    api.kill('SIGTERM');
    void stub.close();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
api.on('exit', code => { void stub.close().finally(() => process.exit(code ?? 0)); });
