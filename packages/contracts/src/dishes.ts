import { z } from "zod";
import { dishGoalSchema, dishItemSchema, dishVisibilitySchema } from "./flavor";

const uuidSchema = z.string().uuid();

export const createDishRequestSchema = z.object({
  name: z.string().trim().min(1).max(160),
  goal: dishGoalSchema.default("balanced"),
  visibility: dishVisibilitySchema.default("private"),
  description: z.string().trim().max(4000).nullable().optional(),
  imageUrl: z.string().url().max(2048).nullable().optional(),
  parentDishId: uuidSchema.nullable().optional(),
  items: z.array(dishItemSchema).min(1).max(24)
});
export type CreateDishRequest = z.input<typeof createDishRequestSchema>;
export type NormalizedCreateDishRequest = z.output<typeof createDishRequestSchema>;

export const updateDishRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(160).optional(),
    goal: dishGoalSchema.optional(),
    visibility: dishVisibilitySchema.optional(),
    description: z.string().trim().max(4000).nullable().optional(),
    imageUrl: z.string().url().max(2048).nullable().optional(),
    items: z.array(dishItemSchema).min(1).max(24).optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be supplied"
  });
export type UpdateDishRequest = z.input<typeof updateDishRequestSchema>;
export type NormalizedUpdateDishRequest = z.output<typeof updateDishRequestSchema>;

export const dishItemResponseSchema = dishItemSchema.extend({
  id: uuidSchema,
  position: z.number().int().nonnegative(),
  note: z.string().nullable()
});

export const dishOwnerSchema = z.object({
  id: uuidSchema,
  username: z.string(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().nullable()
});

export const dishResponseSchema = z.object({
  id: uuidSchema,
  ownerId: uuidSchema,
  name: z.string(),
  goal: dishGoalSchema,
  visibility: dishVisibilitySchema,
  shareToken: uuidSchema.optional(),
  parentDishId: uuidSchema.nullable(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  publishedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  owner: dishOwnerSchema.optional(),
  items: z.array(dishItemResponseSchema)
});
export type DishResponse = z.infer<typeof dishResponseSchema>;

export const publicDishListQuerySchema = z.object({
  cursor: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  search: z.string().trim().max(120).optional()
});
export type PublicDishListQuery = z.input<typeof publicDishListQuerySchema>;

export const publicDishListResponseSchema = z.object({
  items: z.array(dishResponseSchema),
  nextCursor: z.string().datetime().nullable()
});
export type PublicDishListResponse = z.infer<typeof publicDishListResponseSchema>;

export const remixDishRequestSchema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  visibility: dishVisibilitySchema.default("private")
});
export type RemixDishRequest = z.input<typeof remixDishRequestSchema>;
