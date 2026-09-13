import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { DishItem, DishResponse, DishVisibility, NormalizedCreateDishRequest, NormalizedUpdateDishRequest, PublicDishListResponse } from '@flavorpilot/contracts';
import { count, desc, eq, ilike, inArray, lt, max, ne, type SQL } from 'drizzle-orm';
import { allOf } from '../common/sql';
import { assertValidDishItems } from '../common/catalog-validation';
import { DatabaseService, type FlavorPilotDatabase } from '../database/database.service';
import { dishes, dishItems, dishVersions, profiles, subscriptions, type DishSnapshot } from '../database/schema';
import { hasActivePaidEntitlement } from './subscription-entitlement';
interface DishSelectRow {
    id: string;
    ownerId: string;
    name: string;
    goal: DishResponse['goal'];
    visibility: DishVisibility;
    shareToken: string;
    parentDishId: string | null;
    description: string | null;
    imageUrl: string | null;
    publishedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    ownerUsername: string | null;
    ownerDisplayName: string | null;
    ownerAvatarUrl: string | null;
}
type DishItemRow = typeof dishItems.$inferSelect;
type MutationExecutor = Pick<FlavorPilotDatabase, 'delete' | 'insert'>;
@Injectable()
export class DishesService {
    constructor(private readonly database: DatabaseService) { }
    async listPublic(input: {
        cursor?: string;
        limit: number;
        search?: string;
    }): Promise<PublicDishListResponse> {
        const db = this.database.requireDatabase(), filters: SQL[] = [];
        if (input.cursor)
            filters.push(lt(dishes.publishedAt, new Date(input.cursor)));
        if (input.search)
            filters.push(ilike(dishes.name, `%${input.search.replace(/[%_]/g, '\\$&')}%`));
        const rows = await this.selectRows(db, allOf(eq(dishes.visibility, 'public'), ...filters), input.limit + 1);
        const hasMore = rows.length > input.limit, page = hasMore ? rows.slice(0, input.limit) : rows;
        const grouped = await this.loadItems(db, page.map(row => row.id)), last = page.at(-1);
        return { items: page.map(row => this.serialize(row, grouped.get(row.id) ?? [], false)), nextCursor: hasMore && last?.publishedAt ? last.publishedAt.toISOString() : null };
    }
    async getPublic(id: string): Promise<DishResponse> { return this.lookup(allOf(eq(dishes.id, id), eq(dishes.visibility, 'public')), false); }
    async getByShareToken(token: string): Promise<DishResponse> { return this.lookup(allOf(eq(dishes.shareToken, token), ne(dishes.visibility, 'private')), false); }
    async getMine(ownerId: string, id: string): Promise<DishResponse> { return this.lookup(allOf(eq(dishes.id, id), eq(dishes.ownerId, ownerId)), true); }
    async listMine(ownerId: string): Promise<DishResponse[]> {
        const db = this.database.requireDatabase(), rows = await this.selectRows(db, eq(dishes.ownerId, ownerId), 100);
        const grouped = await this.loadItems(db, rows.map(row => row.id));
        return rows.map(row => this.serialize(row, grouped.get(row.id) ?? [], true));
    }
    async create(ownerId: string, input: NormalizedCreateDishRequest): Promise<DishResponse> {
        assertValidDishItems(input.items);
        await this.assertParent(ownerId, input.parentDishId ?? null);
        await this.assertCapacity(ownerId, input.visibility);
        const db = this.database.requireDatabase();
        try {
            const id = await db.transaction(async (tx) => {
                const now = new Date();
                const [created] = await tx.insert(dishes).values({ ownerId, name: input.name, goal: input.goal, visibility: input.visibility, parentDishId: input.parentDishId ?? null, description: input.description ?? null, imageUrl: input.imageUrl ?? null, publishedAt: input.visibility === 'public' ? now : null, updatedAt: now }).returning({ id: dishes.id });
                if (!created)
                    throw new Error('Dish insert returned no id');
                await this.replaceItems(tx, created.id, input.items);
                await tx.insert(dishVersions).values({ dishId: created.id, versionNumber: 1, snapshot: this.snapshot(input), createdBy: ownerId });
                return created.id;
            });
            return this.getMine(ownerId, id);
        }
        catch (error) {
            this.translateError(error);
            throw error;
        }
    }
    async update(ownerId: string, id: string, input: NormalizedUpdateDishRequest): Promise<DishResponse> {
        const existing = await this.getMine(ownerId, id);
        const nextItems = input.items ?? existing.items.map(({ ingredientId, grams, preparationId }) => ({ ingredientId, grams, preparationId }));
        assertValidDishItems(nextItems);
        const visibility = input.visibility ?? existing.visibility;
        // Keep existing private recipes private/editable after a downgrade. Limit only an increase.
        if (!(existing.visibility === 'private' && visibility === 'private'))
            await this.assertCapacity(ownerId, visibility, id);
        const next = { name: input.name ?? existing.name, goal: input.goal ?? existing.goal, visibility, description: input.description === undefined ? existing.description : input.description, imageUrl: input.imageUrl === undefined ? existing.imageUrl : input.imageUrl, parentDishId: existing.parentDishId, items: nextItems };
        const db = this.database.requireDatabase();
        try {
            await db.transaction(async (tx) => {
                const [locked] = await tx.select({ id: dishes.id, updatedAt: dishes.updatedAt }).from(dishes).where(allOf(eq(dishes.id, id), eq(dishes.ownerId, ownerId))).for('update');
                if (!locked)
                    throw this.notFound();
                // Do not overwrite changes committed between our read and the row lock.
                if (locked.updatedAt.toISOString() !== existing.updatedAt)
                    throw new ConflictException({ code: 'DISH_UPDATE_CONFLICT', message: 'The recipe changed while saving. Reload it and retry.' });
                const now = new Date(), publishedAt = visibility === 'public' ? (existing.publishedAt ? new Date(existing.publishedAt) : now) : null;
                await tx.update(dishes).set({ name: next.name, goal: next.goal, visibility, description: next.description ?? null, imageUrl: next.imageUrl ?? null, parentDishId: next.parentDishId ?? null, publishedAt, updatedAt: now }).where(allOf(eq(dishes.id, id), eq(dishes.ownerId, ownerId)));
                if (input.items)
                    await this.replaceItems(tx, id, next.items);
                const [version] = await tx.select({ current: max(dishVersions.versionNumber) }).from(dishVersions).where(eq(dishVersions.dishId, id));
                await tx.insert(dishVersions).values({ dishId: id, versionNumber: Number(version?.current ?? 0) + 1, snapshot: this.snapshot(next), createdBy: ownerId });
            });
            return this.getMine(ownerId, id);
        }
        catch (error) {
            this.translateError(error);
            throw error;
        }
    }
    async delete(ownerId: string, id: string): Promise<void> {
        const result = await this.database.requireDatabase().delete(dishes).where(allOf(eq(dishes.id, id), eq(dishes.ownerId, ownerId))).returning({ id: dishes.id });
        if (!result.length)
            throw this.notFound();
    }
    async remix(ownerId: string, sourceId: string, options: {
        name?: string;
        visibility: DishVisibility;
    }): Promise<DishResponse> {
        const source = await this.getPublic(sourceId);
        return this.create(ownerId, { name: options.name ?? `${source.name} remix`, goal: source.goal, visibility: options.visibility, description: source.description, imageUrl: null, parentDishId: source.id, items: source.items.map(({ ingredientId, grams, preparationId }) => ({ ingredientId, grams, preparationId })) });
    }
    private async selectRows(db: FlavorPilotDatabase, condition: SQL, limit: number): Promise<DishSelectRow[]> {
        return db.select({ id: dishes.id, ownerId: dishes.ownerId, name: dishes.name, goal: dishes.goal, visibility: dishes.visibility, shareToken: dishes.shareToken, parentDishId: dishes.parentDishId, description: dishes.description, imageUrl: dishes.imageUrl, publishedAt: dishes.publishedAt, createdAt: dishes.createdAt, updatedAt: dishes.updatedAt, ownerUsername: profiles.username, ownerDisplayName: profiles.displayName, ownerAvatarUrl: profiles.avatarUrl }).from(dishes).leftJoin(profiles, eq(profiles.id, dishes.ownerId)).where(condition).orderBy(desc(dishes.publishedAt), desc(dishes.updatedAt)).limit(limit);
    }
    private async lookup(condition: SQL, exposeToken: boolean): Promise<DishResponse> {
        const db = this.database.requireDatabase(), [row] = await this.selectRows(db, condition, 1);
        if (!row)
            throw this.notFound();
        const items = await db.select().from(dishItems).where(eq(dishItems.dishId, row.id)).orderBy(dishItems.position);
        return this.serialize(row, items, exposeToken);
    }
    private async loadItems(db: FlavorPilotDatabase, ids: string[]): Promise<Map<string, DishItemRow[]>> {
        const result = new Map<string, DishItemRow[]>();
        if (!ids.length)
            return result;
        const rows = await db.select().from(dishItems).where(inArray(dishItems.dishId, ids)).orderBy(dishItems.dishId, dishItems.position);
        for (const row of rows) {
            const group = result.get(row.dishId) ?? [];
            group.push(row);
            result.set(row.dishId, group);
        }
        return result;
    }
    private serialize(row: DishSelectRow, items: DishItemRow[], exposeToken: boolean): DishResponse {
        return { id: row.id, ownerId: row.ownerId, name: row.name, goal: row.goal, visibility: row.visibility, ...(exposeToken ? { shareToken: row.shareToken } : {}), parentDishId: row.parentDishId, description: row.description, imageUrl: row.imageUrl, publishedAt: row.publishedAt?.toISOString() ?? null, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(), owner: row.ownerUsername ? { id: row.ownerId, username: row.ownerUsername, displayName: row.ownerDisplayName, avatarUrl: row.ownerAvatarUrl } : undefined, items: items.map(item => ({ id: item.id, ingredientId: item.ingredientId, grams: Number(item.grams), preparationId: item.preparationId, position: item.position, note: item.note })) };
    }
    private async assertParent(ownerId: string, parentDishId: string | null) {
        if (!parentDishId)
            return;
        const [parent] = await this.database.requireDatabase().select({ ownerId: dishes.ownerId, visibility: dishes.visibility }).from(dishes).where(eq(dishes.id, parentDishId)).limit(1);
        if (!parent || (parent.visibility !== 'public' && parent.ownerId !== ownerId))
            throw new BadRequestException({ code: 'INVALID_PARENT_DISH', message: 'A remix parent must be public or owned by the authenticated user' });
    }
    private async assertCapacity(ownerId: string, visibility: DishVisibility, excludeId?: string) {
        if (visibility !== 'private')
            return;
        const db = this.database.requireDatabase();
        const [plan] = await db.select({ tier: subscriptions.tier, status: subscriptions.status, currentPeriodEnd: subscriptions.currentPeriodEnd }).from(subscriptions).where(eq(subscriptions.userId, ownerId)).limit(1);
        if (hasActivePaidEntitlement(plan))
            return;
        const filters: SQL[] = [eq(dishes.visibility, 'private')];
        if (excludeId)
            filters.push(ne(dishes.id, excludeId));
        const [result] = await db.select({ total: count() }).from(dishes).where(allOf(eq(dishes.ownerId, ownerId), ...filters));
        if (Number(result?.total ?? 0) >= 3)
            throw new ConflictException({ code: 'FREE_PRIVATE_DISH_LIMIT_REACHED', message: 'The Free plan includes up to three private dishes' });
    }
    private async replaceItems(tx: MutationExecutor, dishId: string, items: DishItem[]) {
        await tx.delete(dishItems).where(eq(dishItems.dishId, dishId));
        if (!items.length)
            return;
        await tx.insert(dishItems).values(items.map((item, position) => ({ dishId, ingredientId: item.ingredientId, grams: item.grams.toString(), preparationId: item.preparationId, position })));
    }
    private snapshot(input: {
        name: string;
        goal: DishResponse['goal'];
        visibility: DishVisibility;
        description?: string | null;
        imageUrl?: string | null;
        parentDishId?: string | null;
        items: DishItem[];
    }): DishSnapshot {
        return { name: input.name, goal: input.goal, visibility: input.visibility, description: input.description ?? null, imageUrl: input.imageUrl ?? null, parentDishId: input.parentDishId ?? null, items: input.items.map(item => ({ ...item })) };
    }
    private notFound() { return new NotFoundException({ code: 'DISH_NOT_FOUND', message: 'The requested dish was not found or is not visible to this user' }); }
    private translateError(error: unknown): void {
        const messages: string[] = [];
        let cause = error;
        for (let i = 0; i < 4 && cause instanceof Error; i++) {
            messages.push(cause.message);
            cause = cause.cause;
        }
        const message = messages.join(' ');
        const rules = [['FREE_PRIVATE_DISH_LIMIT_REACHED', 'The Free plan includes up to three private dishes', 409], ['INVALID_PARENT_DISH', 'A remix parent must be public or owned by the authenticated user', 400], ['IMMUTABLE_PARENT_DISH', 'Remix ancestry cannot be changed after creation', 409], ['UNSUPPORTED_DISH_ITEM', 'Unsupported ingredient/preparation combination', 400], ['DISH_ITEM_LIMIT_REACHED', 'A dish can contain at most 24 ingredient/preparation rows', 400], ['dish_items_unique_ingredient_idx', 'Duplicate ingredient/preparation row', 409]] as const;
        for (const [code, text, status] of rules)
            if (message.includes(code)) {
                const payload = { code: code === 'dish_items_unique_ingredient_idx' ? 'DUPLICATE_DISH_ITEM' : code, message: text };
                throw status === 409 ? new ConflictException(payload) : new BadRequestException(payload);
            }
    }
}
