import { and, type SQL } from 'drizzle-orm';
/** Access-controlled lookups must never accidentally execute without WHERE. */
export function allOf(first: SQL, ...rest: SQL[]): SQL {
    const predicate = and(first, ...rest);
    if (!predicate)
        throw new Error('Expected at least one SQL condition');
    return predicate;
}
