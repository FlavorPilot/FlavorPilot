import { describe, it, expect } from 'vitest';
import { en } from './en';
import { uk } from './uk';
describe('English/Ukrainian dictionary parity', () => {
    it('provides every key in both languages', () => {
        for (const group of Object.keys(en) as Array<keyof typeof en>) {
            expect(Object.keys(uk[group]).sort()).toEqual(Object.keys(en[group]).sort());
            for (const value of Object.values(uk[group]))
                expect(value.trim().length).toBeGreaterThan(0);
        }
    });
});
