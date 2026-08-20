import { z } from "zod";

export const apiErrorSchema = z.object({
  statusCode: z.number().int(),
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
  requestId: z.string().optional(),
  timestamp: z.string().datetime().optional(),
  path: z.string().optional()
});
export type ApiError = z.infer<typeof apiErrorSchema>;

export const healthResponseSchema = z.object({
  status: z.literal("ok"),
  service: z.string(),
  version: z.string(),
  database: z.enum(["connected", "not_configured", "unavailable"]),
  timestamp: z.string().datetime()
});
export type HealthResponse = z.infer<typeof healthResponseSchema>;
