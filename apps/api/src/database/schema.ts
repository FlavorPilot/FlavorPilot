import type { DishGoal, DishItem, DishVisibility, DishAnalysis, FeedbackRecipeSnapshot, NormalizedModelFeedbackRequest } from '@flavorpilot/contracts';
import { boolean, index, integer, jsonb, numeric, pgEnum, pgTable, smallint, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
export const dishVisibilityEnum = pgEnum('dish_visibility', ['public', 'unlisted', 'private']);
export const subscriptionTierEnum = pgEnum('subscription_tier', ['free', 'pro', 'studio', 'kitchen']);
const created = () => timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow();
const updated = () => timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow();
export const profiles = pgTable('profiles', {
    id: uuid('id').primaryKey(), username: text('username').notNull(), displayName: text('display_name'), bio: text('bio'), avatarUrl: text('avatar_url'), locale: text('locale').notNull().default('en'), createdAt: created(), updatedAt: updated()
}, t => [uniqueIndex('profiles_username_idx').on(t.username)]);
export const dishes = pgTable('dishes', {
    id: uuid('id').primaryKey().defaultRandom(), ownerId: uuid('owner_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }), name: text('name').notNull(), goal: text('goal').$type<DishGoal>().notNull().default('balanced'), visibility: dishVisibilityEnum('visibility').$type<DishVisibility>().notNull().default('private'), shareToken: uuid('share_token').notNull().defaultRandom(), parentDishId: uuid('parent_dish_id'), description: text('description'), imageUrl: text('image_url'), publishedAt: timestamp('published_at', { withTimezone: true, mode: 'date' }), createdAt: created(), updatedAt: updated()
}, t => [index('dishes_owner_idx').on(t.ownerId, t.updatedAt), index('dishes_public_idx').on(t.publishedAt), index('dishes_parent_idx').on(t.parentDishId), uniqueIndex('dishes_share_token_idx').on(t.shareToken)]);
export const dishItems = pgTable('dish_items', {
    id: uuid('id').primaryKey().defaultRandom(), dishId: uuid('dish_id').notNull().references(() => dishes.id, { onDelete: 'cascade' }), ingredientId: text('ingredient_id').notNull(), grams: numeric('grams', { precision: 10, scale: 3 }).notNull(), preparationId: text('preparation_id').notNull(), position: smallint('position').notNull().default(0), note: text('note'), createdAt: created()
}, t => [index('dish_items_dish_idx').on(t.dishId, t.position), uniqueIndex('dish_items_unique_ingredient_idx').on(t.dishId, t.ingredientId, t.preparationId)]);
export interface DishSnapshot {
    name: string;
    goal: DishGoal;
    visibility: DishVisibility;
    description: string | null;
    imageUrl: string | null;
    parentDishId: string | null;
    items: DishItem[];
}
export const dishVersions = pgTable('dish_versions', {
    id: uuid('id').primaryKey().defaultRandom(), dishId: uuid('dish_id').notNull().references(() => dishes.id, { onDelete: 'cascade' }), versionNumber: integer('version_number').notNull(), snapshot: jsonb('snapshot').$type<DishSnapshot>().notNull(), createdBy: uuid('created_by').notNull().references(() => profiles.id), createdAt: created()
}, t => [uniqueIndex('dish_versions_number_idx').on(t.dishId, t.versionNumber)]);
export const favorites = pgTable('favorites', {
    userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }), dishId: uuid('dish_id').notNull().references(() => dishes.id, { onDelete: 'cascade' }), createdAt: created()
}, t => [uniqueIndex('favorites_user_dish_idx').on(t.userId, t.dishId), index('favorites_dish_idx').on(t.dishId)]);
export const subscriptions = pgTable('subscriptions', {
    userId: uuid('user_id').primaryKey().references(() => profiles.id, { onDelete: 'cascade' }), tier: subscriptionTierEnum('tier').notNull().default('free'), providerCustomerId: text('provider_customer_id'), providerSubscriptionId: text('provider_subscription_id'), status: text('status').notNull().default('inactive'), currentPeriodEnd: timestamp('current_period_end', { withTimezone: true, mode: 'date' }), updatedAt: updated()
});
export const modelFeedback = pgTable('model_feedback', {
    id: uuid('id').primaryKey().defaultRandom(), authorId: uuid('author_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    dishId: uuid('dish_id').references(() => dishes.id, { onDelete: 'set null' }), dishVersionNumber: integer('dish_version_number'),
    snapshotKey: text('snapshot_key').notNull(), recipeSnapshot: jsonb('recipe_snapshot').$type<FeedbackRecipeSnapshot>().notNull(),
    analysisSnapshot: jsonb('analysis_snapshot').$type<DishAnalysis>().notNull(), modelVersion: text('model_version').notNull(), catalogueVersion: text('catalogue_version').notNull(),
    cooked: boolean('cooked').notNull(), agreement: text('agreement').$type<NormalizedModelFeedbackRequest['agreement']>().notNull(),
    concerns: jsonb('concerns').$type<NormalizedModelFeedbackRequest['concerns']>().notNull(), note: text('note').notNull().default(''),
    createdAt: created(), updatedAt: updated(),
}, t => [uniqueIndex('model_feedback_author_snapshot_idx').on(t.authorId, t.snapshotKey)]);
export const dishComments = pgTable('dish_comments', {
    id: uuid('id').primaryKey().defaultRandom(), dishId: uuid('dish_id').notNull().references(() => dishes.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }), parentId: uuid('parent_id'),
    text: text('body'), hasCooked: boolean('has_cooked').notNull().default(false), versionNumber: integer('version_number').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date', precision: 3 }).notNull().defaultNow(), deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
}, t => [index('dish_comments_page_idx').on(t.dishId, t.createdAt, t.id)]);
