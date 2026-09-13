import { BadRequestException } from '@nestjs/common';
import type { ZodType } from 'zod';
export function parseInput<T>(schema: ZodType<T>, value: unknown): T {
    const result = schema.safeParse(value);
    if (!result.success)
        throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'Request validation failed', details: result.error.issues.map(i => ({ path: i.path, code: i.code, message: i.message })) });
    return result.data;
}
