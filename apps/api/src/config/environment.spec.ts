import { describe, it, expect } from 'vitest';
import { validateEnvironment } from './environment';
describe('environment flags', () => {
    it('parses the string false as false', () => { expect(validateEnvironment({ SWAGGER_ENABLED: 'false' }).SWAGGER_ENABLED).toBe(false); });
    it('allows demo boot without external keys', () => { expect(validateEnvironment({}).DATABASE_URL).toBeUndefined(); });
    it('AI is off by default', () => { expect(validateEnvironment({}).AI_ENABLED).toBe(false); });
    it('blocks production AI pending quota implementation', () => { expect(() => validateEnvironment({ NODE_ENV: 'production', AI_ENABLED: 'true' })).toThrow(); });
    it('rejects invalid ports', () => { expect(() => validateEnvironment({ API_PORT: '0' })).toThrow(); });
    it('rejects wildcard CORS in production', () => { expect(() => validateEnvironment({ NODE_ENV: 'production', CORS_ORIGINS: '*' })).toThrow(); });
});
