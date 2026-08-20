import type { DishGoal, DishItem, DishVisibility } from "@flavorpilot/contracts";
import {
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";

export const dishVisibilityEnum = pgEnum("dish_visibility", [
  "public",
  "unlisted",
  "private"
]);
export const subscriptionTierEnum = pgEnum("subscription_tier", [
  "free",
  "pro",
  "studio",
  "kitchen"
]);

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey(),
    username: text("username").notNull(),
    displayName: text("display_name"),
    bio: text("bio"),
    avatarUrl: text("avatar_url"),
    locale: text("locale").notNull().default("en"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow()
  },
  (table) => [uniqueIndex("profiles_username_idx").on(table.username)]
);

export const dishes = pgTable(
  "dishes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    goal: text("goal").$type<DishGoal>().notNull().default("balanced"),
    visibility: dishVisibilityEnum("visibility")
      .$type<DishVisibility>()
      .notNull()
      .default("private"),
    shareToken: uuid("share_token").notNull().defaultRandom(),
    parentDishId: uuid("parent_dish_id"),
    description: text("description"),
    imageUrl: text("image_url"),
    publishedAt: timestamp("published_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow()
  },
  (table) => [
    index("dishes_owner_idx").on(table.ownerId, table.updatedAt),
    index("dishes_public_idx").on(table.publishedAt),
    index("dishes_parent_idx").on(table.parentDishId),
    uniqueIndex("dishes_share_token_idx").on(table.shareToken)
  ]
);

export const dishItems = pgTable(
  "dish_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    dishId: uuid("dish_id")
      .notNull()
      .references(() => dishes.id, { onDelete: "cascade" }),
    ingredientId: text("ingredient_id").notNull(),
    grams: numeric("grams", { precision: 10, scale: 3 }).notNull(),
    preparationId: text("preparation_id").notNull(),
    position: smallint("position").notNull().default(0),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow()
  },
  (table) => [
    index("dish_items_dish_idx").on(table.dishId, table.position),
    uniqueIndex("dish_items_unique_ingredient_idx").on(
      table.dishId,
      table.ingredientId,
      table.preparationId
    )
  ]
);

export interface DishSnapshot {
  name: string;
  goal: DishGoal;
  visibility: DishVisibility;
  description: string | null;
  imageUrl: string | null;
  parentDishId: string | null;
  items: DishItem[];
}

export const dishVersions = pgTable(
  "dish_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    dishId: uuid("dish_id")
      .notNull()
      .references(() => dishes.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number").notNull(),
    snapshot: jsonb("snapshot").$type<DishSnapshot>().notNull(),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow()
  },
  (table) => [uniqueIndex("dish_versions_number_idx").on(table.dishId, table.versionNumber)]
);

export const favorites = pgTable(
  "favorites",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    dishId: uuid("dish_id")
      .notNull()
      .references(() => dishes.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex("favorites_user_dish_idx").on(table.userId, table.dishId),
    index("favorites_dish_idx").on(table.dishId)
  ]
);

export const subscriptions = pgTable("subscriptions", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => profiles.id, { onDelete: "cascade" }),
  tier: subscriptionTierEnum("tier").notNull().default("free"),
  providerCustomerId: text("provider_customer_id"),
  providerSubscriptionId: text("provider_subscription_id"),
  status: text("status").notNull().default("inactive"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true, mode: "date" }),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow()
});
