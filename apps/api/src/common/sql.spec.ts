import { describe, it, expect } from 'vitest';
import { sql } from 'drizzle-orm';
import { allOf } from './sql';
describe('required predicates', () => {
    it('always returns a SQL expression for valid non-empty arguments', () => { expect(allOf(sql `true`, sql `false`)).toBeDefined(); });
    it('fails closed if JavaScript bypasses the TypeScript signature', () => { expect(() => allOf(undefined as never)).toThrow(); });
});
