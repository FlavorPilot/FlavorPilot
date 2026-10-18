import { z } from 'zod';
const optionalText = z.preprocess(value => typeof value === 'string' && value.trim() === '' ? undefined : value, z.string().optional());
const bool = (fallback: boolean) => z.preprocess(value => value === undefined || value === '' ? fallback : value === 'true' ? true : value === 'false' ? false : value, z.boolean());
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'), API_HOST: z.string().default('0.0.0.0'),
    PORT: z.preprocess(value => value === '' ? undefined : value, z.coerce.number().int().min(1).max(65535).optional()),
    API_PORT: z.coerce.number().int().min(1).max(65535).default(4000), API_PREFIX: z.string().regex(/^[a-zA-Z0-9_-]+$/).default('v1'),
    CORS_ORIGINS: z.string().default('http://localhost:3000'), SWAGGER_ENABLED: bool(true),
    DATABASE_URL: optionalText, DATABASE_SSL: z.enum(['auto', 'require', 'disable']).default('auto'), DATABASE_POOL_SIZE: z.coerce.number().int().min(1).max(50).default(10),
    SUPABASE_URL: optionalText, SUPABASE_PUBLISHABLE_KEY: optionalText, OPENAI_API_KEY: optionalText, OPENAI_MODEL: z.string().default('gpt-5.4-mini-2026-03-17'),
    AI_ENABLED: bool(false), ADMIN_REQUIRE_MFA: bool(true),
    AI_PILOT_USER_IDS: z.string().default('').refine(s=>s===''||s.split(',').every(id=>z.string().uuid().safeParse(id.trim()).success)),
    AI_DAILY_BUDGET_USD: z.coerce.number().positive().max(1000).default(5), AI_MONTHLY_BUDGET_USD: z.coerce.number().positive().max(10000).default(50)
});
export function validateEnvironment(input: Record<string, unknown>) {
    const result = envSchema.safeParse(input);
    if (!result.success)
        throw new Error(`Invalid API configuration: ${result.error.issues.map(i => i.path.join('.')).join(', ')}`);
    if (result.data.NODE_ENV === 'production' && result.data.CORS_ORIGINS.split(',').some(x => x.trim() === '*'))
        throw new Error('Wildcard CORS is not allowed in production');
    if (result.data.AI_ENABLED && (!result.data.DATABASE_URL || !result.data.OPENAI_API_KEY))
        throw new Error('AI requires database-backed quotas and OPENAI_API_KEY');
    if (result.data.AI_ENABLED && result.data.OPENAI_MODEL !== 'gpt-5.4-mini-2026-03-17')
        throw new Error('AI model must match the tested snapshot and budget prices');
    if (result.data.NODE_ENV === 'production' && !result.data.ADMIN_REQUIRE_MFA)
        throw new Error('Administrative MFA cannot be disabled in production');
    return result.data;
}
