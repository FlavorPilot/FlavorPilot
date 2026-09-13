import { describe, it, expect } from 'vitest';
import { preferredLocale } from './index';
describe('language routing', () => {
    it('respects quality values', () => expect(preferredLocale('uk;q=0.3,en;q=0.9')).toBe('en'));
    it('handles regional Ukrainian', () => expect(preferredLocale('uk-UA,en;q=0.8')).toBe('uk'));
    it('ignores excluded languages', () => expect(preferredLocale('uk;q=0,en;q=0.5')).toBe('en'));
    it('allows only supported saved preferences', () => { expect(preferredLocale('uk', 'ru')).toBe('uk'); expect(preferredLocale('uk', 'en')).toBe('en'); });
});
