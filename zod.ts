import { BadRequestException } from "@nestjs/common";
import { z } from "zod";

export function parseWithSchema<TSchema extends z.ZodType>(
  schema: TSchema,
  value: unknown
): z.output<TSchema> {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new BadRequestException({
      code: "VALIDATION_ERROR",
      message: "Request validation failed",
      details: z.treeifyError(parsed.error)
    });
  }
  return parsed.data;
}
