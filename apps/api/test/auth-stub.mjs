import { createServer } from 'node:http';
import { randomBytes, randomUUID } from 'node:crypto';
import postgres from 'postgres';

const KEY = 'test-publishable-key';

function userPayload(user) {
    const now = new Date().toISOString();
    return {
        id: user.id, aud: 'authenticated', role: 'authenticated', email: user.email,
        email_confirmed_at: now, app_metadata: { provider: 'email', providers: ['email'] },
        user_metadata: {}, created_at: now, updated_at: now,
    };
}

function sessionPayload(user, tokens) {
    return { access_token: tokens.access, token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: tokens.refresh, user: userPayload(user) };
}

async function readJson(request) {
    const chunks = [];
    for await (const chunk of request)
        chunks.push(chunk);
    if (!chunks.length)
        return {};
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

export function startAuthStub({ databaseUrl, port = 0 }) {
    const sql = postgres(databaseUrl, { max: 2, prepare: false, ssl: false });
    const access = new Map();
    const refresh = new Map();
    const passwords = new Map();
    function issue(user) {
        const tokens = { access: randomBytes(24).toString('hex'), refresh: randomBytes(24).toString('hex') };
        access.set(tokens.access, user);
        refresh.set(tokens.refresh, user);
        return tokens;
    }
    const server = createServer(async (request, response) => {
        const origin = request.headers.origin;
        if (origin) {
            response.setHeader('Access-Control-Allow-Origin', origin);
            response.setHeader('Access-Control-Allow-Credentials', 'true');
            response.setHeader('Vary', 'Origin');
        }
        response.setHeader('Access-Control-Allow-Headers', request.headers['access-control-request-headers'] ?? 'authorization, apikey, content-type');
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        if (request.method === 'OPTIONS') {
            response.writeHead(204);
            response.end();
            return;
        }
        const url = new URL(request.url ?? '/', 'http://127.0.0.1');
        const send = (status, body) => {
            response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
            response.end(body === undefined ? '' : JSON.stringify(body));
        };
        try {
            if (request.method === 'GET' && url.pathname === '/auth/v1/user') {
                const token = String(request.headers.authorization ?? '').replace(/^Bearer /, '');
                const user = access.get(token);
                if (!user)
                    return send(401, { msg: 'invalid claim' });
                return send(200, userPayload(user));
            }
            if (request.method === 'POST' && url.pathname === '/auth/v1/signup') {
                const body = await readJson(request);
                const email = String(body.email ?? '').toLowerCase();
                const password = String(body.password ?? '');
                if (!email.includes('@') || password.length < 8)
                    return send(400, { msg: 'Invalid signup' });
                if (passwords.has(email))
                    return send(400, { error_code: 'user_already_exists', msg: 'User already registered' });
                const id = randomUUID();
                await sql`insert into auth.users (id, email) values (${id}::uuid, ${email})`;
                const user = { id, email };
                passwords.set(email, { user, password });
                return send(200, sessionPayload(user, issue(user)));
            }
            if (request.method === 'POST' && url.pathname === '/auth/v1/token' && url.searchParams.get('grant_type') === 'password') {
                const body = await readJson(request);
                const email = String(body.email ?? '').toLowerCase();
                const record = passwords.get(email);
                if (!record || record.password !== String(body.password ?? ''))
                    return send(400, { error_code: 'invalid_credentials', msg: 'Invalid login credentials' });
                return send(200, sessionPayload(record.user, issue(record.user)));
            }
            if (request.method === 'POST' && url.pathname === '/auth/v1/token' && url.searchParams.get('grant_type') === 'refresh_token') {
                const body = await readJson(request);
                const user = refresh.get(String(body.refresh_token ?? ''));
                if (!user)
                    return send(401, { msg: 'invalid refresh token' });
                return send(200, sessionPayload(user, issue(user)));
            }
            if (request.method === 'POST' && url.pathname === '/auth/v1/logout')
                return send(204);
            return send(404, { msg: 'not found' });
        }
        catch {
            send(500, { msg: 'auth stub failed' });
        }
    });
    return new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, '127.0.0.1', () => {
            const address = server.address();
            const actual = typeof address === 'object' && address ? address.port : port;
            resolve({
                url: `http://127.0.0.1:${actual}`,
                key: KEY,
                close: async () => {
                    await new Promise(done => server.close(() => done()));
                    await sql.end();
                },
            });
        });
    });
}
