import { describe, it, expect } from 'vitest';
import { hasActivePaidEntitlement } from './subscription-entitlement';
describe('server plan entitlement', () => {
    it('does not trust a missing or free subscription', () => { expect(hasActivePaidEntitlement(undefined)).toBe(false); expect(hasActivePaidEntitlement({ tier: 'free', status: 'active', currentPeriodEnd: null })).toBe(false); });
    it('requires an active or trial subscription', () => { for (const status of ['inactive', 'past_due', 'canceled'])
        expect(hasActivePaidEntitlement({ tier: 'pro', status, currentPeriodEnd: null })).toBe(false); });
    it('rejects an expired plan', () => { expect(hasActivePaidEntitlement({ tier: 'pro', status: 'active', currentPeriodEnd: new Date('2000-01-01') })).toBe(false); });
    it('accepts an active unexpired plan', () => { expect(hasActivePaidEntitlement({ tier: 'pro', status: 'active', currentPeriodEnd: new Date('2100-01-01') })).toBe(true); });
});
