import { defineConfig, devices } from '@playwright/test';

const testEnv = {
    NEXT_PUBLIC_API_URL: 'http://127.0.0.1:4000/v1',
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key',
};

export default defineConfig({
    testDir: 'tests/e2e',
    fullyParallel: false,
    workers: 1,
    timeout: 60_000,
    expect: { timeout: 20_000 },
    use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:3000', trace: 'retain-on-failure' },
    webServer: [
        { command: 'node tests/e2e/serve.mjs', url: 'http://127.0.0.1:4000/v1/health', timeout: 120_000, reuseExistingServer: false },
        { command: 'npm run dev --workspace @flavorpilot/web -- --hostname 127.0.0.1 --port 3000', url: 'http://127.0.0.1:3000/en', timeout: 180_000, reuseExistingServer: false, env: testEnv },
    ],
});
