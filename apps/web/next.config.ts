import path from 'node:path';
import type { NextConfig } from 'next';
const config: NextConfig = {
    transpilePackages: ['@flavorpilot/contracts', '@flavorpilot/flavor-engine'],
    output: 'standalone', outputFileTracingRoot: path.resolve(__dirname, '../..'), poweredByHeader: false,
    async headers() {
        return [
            { source: '/:path*', headers: [{ key: 'X-Content-Type-Options', value: 'nosniff' }, { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }] },
            { source: '/:locale/share/:id', headers: [{ key: 'Referrer-Policy', value: 'no-referrer' }, { key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
            { source: '/:locale/auth/:path*', headers: [{ key: 'Referrer-Policy', value: 'no-referrer' }, { key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
        ];
    },
};
export default config;
