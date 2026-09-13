import { z } from 'zod';
const optionalText = z.preprocess(value => typeof value === 'string' && value.trim() === '' ? undefined : value, z.string().optional());
const bool = (fallback: boolean) => z.preprocess(value => value === undefined || value === '' ? fallback : value === 'true' ? true : value === 'false' ? false : value, z.boolean());
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'), API_HOST: z.string().default('0.0.0.0'),
    PORT: z.preprocess(value => value === '' ? undefined : value, z.coerce.number().int().min(1).max(65535).optional()),
    API_PORT: z.coerce.number().int().min(1).max(65535).default(4000), API_PREFIX: z.string().regex(/^[a-zA-Z0-9_-]+$/).default('v1'),
    CORS_ORIGINS: z.string().default('http://localhost:3000'), SWAGGER_ENABLED: bool(true),
    DATABASE_URL: optionalText, DATABASE_SSL: z.enum(['auto', 'require', 'disable']).default('auto'), DATABASE_POOL_SIZE: z.coerce.number().int().min(1).max(50).default(10),
    SUPABASE_URL: optionalText, SUPABASE_PUBLISHABLE_KEY: optionalText, OPENAI_API_KEY: optionalText, OPENAI_MODEL: z.string().default('gpt-5-mini'),
    AI_ENABLED: bool(false)
});
export function validateEnvironment(input: Record<string, unknown>) {
    const result = envSchema.safeParse(input);
    if (!result.success)
        throw new Error(`Invalid API configuration: ${result.error.issues.map(i => i.path.join('.')).join(', ')}`);
    if (result.data.NODE_ENV === 'production' && result.data.CORS_ORIGINS.split(',').some(x => x.trim() === '*'))
        throw new Error('Wildcard CORS is not allowed in production');
    if (result.data.NODE_ENV === 'production' && result.data.AI_ENABLED)
        throw new Error('AI production access requires implemented and tested usage quotas; keep AI_ENABLED=false');
    return result.data;
}
