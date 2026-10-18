import { describe, it, expect } from 'vitest';
import { validateEnvironment } from './environment';
describe('environment flags', () => {
    it('parses the string false as false', () => { expect(validateEnvironment({ SWAGGER_ENABLED: 'false' }).SWAGGER_ENABLED).toBe(false); });
    it('allows demo boot without external keys', () => { expect(validateEnvironment({}).DATABASE_URL).toBeUndefined(); });
    it('AI is off by default', () => { expect(validateEnvironment({}).AI_ENABLED).toBe(false); });
    it('uses Luna and refuses the previous model with Luna accounting',()=>{
        expect(validateEnvironment({}).OPENAI_MODEL).toBe('gpt-6-luna');
        expect(()=>validateEnvironment({AI_ENABLED:'true',DATABASE_URL:'postgres://localhost/test',OPENAI_API_KEY:'test',OPENAI_MODEL:'gpt-5.4-mini-2026-03-17'})).toThrow('budget prices');
    });
    it('requires admin MFA by default and prevents production bypass', () => {
        expect(validateEnvironment({}).ADMIN_REQUIRE_MFA).toBe(true);
        expect(validateEnvironment({NODE_ENV:'test',ADMIN_REQUIRE_MFA:'false'}).ADMIN_REQUIRE_MFA).toBe(false);
        expect(()=>validateEnvironment({NODE_ENV:'production',ADMIN_REQUIRE_MFA:'false'})).toThrow('MFA');
    });
    it('requires server persistence and key before enabling budgeted AI', () => {
        expect(() => validateEnvironment({ NODE_ENV: 'production', AI_ENABLED: 'true' })).toThrow();
        expect(validateEnvironment({NODE_ENV:'production',AI_ENABLED:'true',DATABASE_URL:'postgres://localhost/test',OPENAI_API_KEY:'test'}).AI_ENABLED).toBe(true);
        expect(()=>validateEnvironment({AI_ENABLED:'true',DATABASE_URL:'postgres://localhost/test',OPENAI_API_KEY:'test',OPENAI_MODEL:'unpriced-model'})).toThrow('budget prices');
    });
    it('rejects invalid ports', () => { expect(() => validateEnvironment({ API_PORT: '0' })).toThrow(); });
    it('rejects wildcard CORS in production', () => { expect(() => validateEnvironment({ NODE_ENV: 'production', CORS_ORIGINS: '*' })).toThrow(); });
});
