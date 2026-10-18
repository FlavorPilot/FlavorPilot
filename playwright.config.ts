import { defineConfig, devices } from '@playwright/test';
const apiPort = process.env.FLAVORPILOT_E2E_API_PORT ?? '4100';
const webPort = process.env.FLAVORPILOT_E2E_WEB_PORT ?? '3100';
const authPort = process.env.FLAVORPILOT_E2E_AUTH_PORT ?? '55421';

const testEnv = {
    NEXT_PUBLIC_API_URL: `http://127.0.0.1:${apiPort}/v1`,
    NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${authPort}`,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key',
    FLAVORPILOT_E2E: 'true',
};

export default defineConfig({
    testDir: 'tests/e2e',
    fullyParallel: false,
    workers: 1,
    timeout: 60_000,
    expect: { timeout: 20_000 },
    use: { ...devices['Desktop Chrome'], baseURL: `http://127.0.0.1:${webPort}`, trace: 'retain-on-failure' },
    webServer: [
        { command: 'node tests/e2e/serve.mjs', url: `http://127.0.0.1:${apiPort}/v1/health`, timeout: 120_000, reuseExistingServer: false },
        { command: `npm run dev --workspace @flavorpilot/web -- --hostname 127.0.0.1 --port ${webPort}`, url: `http://127.0.0.1:${webPort}/en`, timeout: 180_000, reuseExistingServer: false, env: testEnv },
    ],
});
