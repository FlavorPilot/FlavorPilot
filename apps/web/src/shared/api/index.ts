import { env } from '@/shared/config';
export class ApiError extends Error {
    constructor(readonly status: number, readonly code: string) { super(code); this.name = 'ApiError'; }
}
export async function request<T>(path: string, parse: (data: unknown) => T, options: {
    method?: string;
    body?: unknown;
    token?: string;
    signal?: AbortSignal;
} = {}): Promise<T> {
    if (!env.apiUrl)
        throw new ApiError(503, 'API_NOT_CONFIGURED');
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (options.signal?.aborted)
        controller.abort();
    options.signal?.addEventListener('abort', abort, { once: true });
    const timer = setTimeout(abort, 15000);
    try {
        const response = await fetch(`${env.apiUrl}${path}`, {
            method: options.method ?? 'GET', cache: 'no-store', signal: controller.signal,
            headers: { Accept: 'application/json', ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
                ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}) },
            ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
        });
        const data: unknown = response.status === 204 ? null : await response.json().catch(() => null);
        if (!response.ok) {
            const code = typeof data === 'object' && data !== null && 'code' in data && typeof data.code === 'string'
                ? data.code : 'API_ERROR';
            throw new ApiError(response.status, code);
        }
        return parse(data);
    }
    finally {
        clearTimeout(timer);
        options.signal?.removeEventListener('abort', abort);
    }
}
