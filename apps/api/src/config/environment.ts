import { z } from "zod";

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_HOST: z.string().default("0.0.0.0"),
  PORT: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(1).max(65535).optional()
  ),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  API_PREFIX: z.string().trim().min(1).default("v1"),
  CORS_ORIGINS: z.string().default("http://localhost:3000"),
  SWAGGER_ENABLED: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .transform((value) => value === true || value === "true")
    .default(true),
  DATABASE_URL: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  DATABASE_SSL: z.enum(["auto", "require", "disable"]).default("auto"),
  DATABASE_POOL_SIZE: z.coerce.number().int().min(1).max(50).default(10),
  SUPABASE_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  SUPABASE_PUBLISHABLE_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  OPENAI_API_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  OPENAI_MODEL: z.string().default("gpt-5-mini")
});

export type Environment = z.infer<typeof environmentSchema>;

export const validateEnvironment = (configuration: Record<string, unknown>): Environment => {
  const parsed = environmentSchema.safeParse(configuration);
  if (!parsed.success) {
    throw new Error(`Invalid environment configuration: ${JSON.stringify(z.treeifyError(parsed.error))}`);
  }
  return parsed.data;
};
