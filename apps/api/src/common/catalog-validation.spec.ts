import { describe, it, expect } from 'vitest';
import { assertValidDishItems } from './catalog-validation';
const item = { ingredientId: 'salmon', grams: 180, preparationId: 'raw' };
describe('catalogue enforcement', () => {
    it('accepts a known combination', () => { expect(() => assertValidDishItems([item])).not.toThrow(); });
    it('rejects unknown IDs', () => { expect(() => assertValidDishItems([{ ...item, ingredientId: 'invented' }])).toThrow(); });
    it('rejects unsupported preparation', () => { expect(() => assertValidDishItems([{ ...item, preparationId: 'pureed' }])).toThrow(); });
    it('rejects repeated ingredient and method', () => { expect(() => assertValidDishItems([item, item])).toThrow(); });
    it('accepts the same ingredient under different supported methods', () => { expect(() => assertValidDishItems([item, { ...item, preparationId: 'seared' }])).not.toThrow(); });
});
