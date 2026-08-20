import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import type {
  DishItem,
  DishResponse,
  DishVisibility,
  NormalizedCreateDishRequest,
  NormalizedUpdateDishRequest,
  PublicDishListResponse
} from "@flavorpilot/contracts";
import {
  and,
  count,
  desc,
  eq,
  ilike,
  inArray,
  lt,
  max,
  ne,
  type SQL
} from "drizzle-orm";
import { assertValidDishItems } from "../common/catalog-validation";
import { DatabaseService, type FlavorPilotDatabase } from "../database/database.service";
import {
  dishes,
  dishItems,
  dishVersions,
  profiles,
  subscriptions,
  type DishSnapshot
} from "../database/schema";
import { hasActivePaidEntitlement } from "./subscription-entitlement";

interface DishSelectRow {
  id: string;
  ownerId: string;
  name: string;
  goal: DishResponse["goal"];
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
type DishMutationExecutor = Pick<FlavorPilotDatabase, "delete" | "insert">;

@Injectable()
export class DishesService {
  constructor(private readonly database: DatabaseService) {}

  async listPublic(input: {
    cursor?: string;
    limit: number;
    search?: string;
  }): Promise<PublicDishListResponse> {
    const db = this.database.requireDatabase();
    const predicates: SQL[] = [eq(dishes.visibility, "public")];

    if (input.cursor) {
      predicates.push(lt(dishes.publishedAt, new Date(input.cursor)));
    }
    if (input.search) {
      predicates.push(ilike(dishes.name, `%${input.search.replace(/[%_]/g, "\\$&")}%`));
    }

    const rows = await this.selectDishRows(db, and(...predicates), input.limit + 1);
    const hasMore = rows.length > input.limit;
    const pageRows = hasMore ? rows.slice(0, input.limit) : rows;
    const itemsByDish = await this.loadItems(db, pageRows.map((row) => row.id));
    const items = pageRows.map((row) => this.serializeDish(row, itemsByDish.get(row.id) ?? [], false));
    const last = pageRows.at(-1);

    return {
      items,
      nextCursor: hasMore && last?.publishedAt ? last.publishedAt.toISOString() : null
    };
  }

  async getPublic(id: string): Promise<DishResponse> {
    const db = this.database.requireDatabase();
    const row = await this.selectDishRow(db, and(eq(dishes.id, id), eq(dishes.visibility, "public"))!,);
    if (!row) throw this.notFound();
    return this.loadSerializedDish(db, row, false);
  }

  async getByShareToken(token: string): Promise<DishResponse> {
    const db = this.database.requireDatabase();
    const row = await this.selectDishRow(
      db,
      and(eq(dishes.shareToken, token), ne(dishes.visibility, "private"))!,
    );
    if (!row) throw this.notFound();
    return this.loadSerializedDish(db, row, false);
  }

  async listMine(ownerId: string): Promise<DishResponse[]> {
    const db = this.database.requireDatabase();
    const rows = await this.selectDishRows(db, eq(dishes.ownerId, ownerId), 100);
    const itemsByDish = await this.loadItems(db, rows.map((row) => row.id));
    return rows.map((row) => this.serializeDish(row, itemsByDish.get(row.id) ?? [], true));
  }

  async getMine(ownerId: string, id: string): Promise<DishResponse> {
    const db = this.database.requireDatabase();
    const row = await this.selectDishRow(
      db,
      and(eq(dishes.id, id), eq(dishes.ownerId, ownerId))!,
    );
    if (!row) throw this.notFound();
    return this.loadSerializedDish(db, row, true);
  }

  async create(ownerId: string, input: NormalizedCreateDishRequest): Promise<DishResponse> {
    assertValidDishItems(input.items);
    await this.assertParentDishAccessible(ownerId, input.parentDishId ?? null);
    await this.assertPrivateDishCapacity(ownerId, input.visibility);
    const db = this.database.requireDatabase();

    try {
      const dishId = await db.transaction(async (tx) => {
        const now = new Date();
        const [created] = await tx
          .insert(dishes)
          .values({
            ownerId,
            name: input.name,
            goal: input.goal,
            visibility: input.visibility,
            parentDishId: input.parentDishId ?? null,
            description: input.description ?? null,
            imageUrl: input.imageUrl ?? null,
            publishedAt: input.visibility === "public" ? now : null,
            updatedAt: now
          })
          .returning({ id: dishes.id });

        if (!created) throw new Error("Dish insert returned no id");
        await this.replaceItems(tx, created.id, input.items);
        await tx.insert(dishVersions).values({
          dishId: created.id,
          versionNumber: 1,
          snapshot: this.snapshot(input),
          createdBy: ownerId
        });
        return created.id;
      });

      return this.getMine(ownerId, dishId);
    } catch (error) {
      this.translateDatabaseError(error);
      throw error;
    }
  }

  async update(
    ownerId: string,
    id: string,
    input: NormalizedUpdateDishRequest
  ): Promise<DishResponse> {
    const existing = await this.getMine(ownerId, id);
    const nextItems = input.items ?? existing.items.map(({ ingredientId, grams, preparationId }) => ({
      ingredientId,
      grams,
      preparationId
    }));
    assertValidDishItems(nextItems);

    const nextVisibility = input.visibility ?? existing.visibility;
    await this.assertPrivateDishCapacity(ownerId, nextVisibility, id);
    const db = this.database.requireDatabase();

    const next = {
      name: input.name ?? existing.name,
      goal: input.goal ?? existing.goal,
      visibility: nextVisibility,
      description: input.description === undefined ? existing.description : input.description,
      imageUrl: input.imageUrl === undefined ? existing.imageUrl : input.imageUrl,
      parentDishId: existing.parentDishId,
      items: nextItems
    };

    try {
      await db.transaction(async (tx) => {
        const [lockedDish] = await tx
          .select({ id: dishes.id })
          .from(dishes)
          .where(and(eq(dishes.id, id), eq(dishes.ownerId, ownerId)))
          .for("update");
        if (!lockedDish) throw this.notFound();

        const now = new Date();
        const publishedAt =
          next.visibility === "public"
            ? existing.publishedAt
              ? new Date(existing.publishedAt)
              : now
            : null;

        await tx
          .update(dishes)
          .set({
            name: next.name,
            goal: next.goal,
            visibility: next.visibility,
            description: next.description ?? null,
            imageUrl: next.imageUrl ?? null,
            parentDishId: next.parentDishId ?? null,
            publishedAt,
            updatedAt: now
          })
          .where(and(eq(dishes.id, id), eq(dishes.ownerId, ownerId)));

        if (input.items) {
          await this.replaceItems(tx, id, next.items);
        }

        const [version] = await tx
          .select({ current: max(dishVersions.versionNumber) })
          .from(dishVersions)
          .where(eq(dishVersions.dishId, id));

        await tx.insert(dishVersions).values({
          dishId: id,
          versionNumber: Number(version?.current ?? 0) + 1,
          snapshot: this.snapshot(next),
          createdBy: ownerId
        });
      });

      return this.getMine(ownerId, id);
    } catch (error) {
      this.translateDatabaseError(error);
      throw error;
    }
  }

  async delete(ownerId: string, id: string): Promise<void> {
    const db = this.database.requireDatabase();
    const deleted = await db
      .delete(dishes)
      .where(and(eq(dishes.id, id), eq(dishes.ownerId, ownerId)))
      .returning({ id: dishes.id });
    if (deleted.length === 0) throw this.notFound();
  }

  async remix(
    ownerId: string,
    sourceId: string,
    options: { name?: string; visibility: DishVisibility }
  ): Promise<DishResponse> {
    const source = await this.getPublic(sourceId);
    return this.create(ownerId, {
      name: options.name ?? `${source.name} remix`,
      goal: source.goal,
      visibility: options.visibility,
      description: source.description,
      imageUrl: null,
      parentDishId: source.id,
      items: source.items.map(({ ingredientId, grams, preparationId }) => ({
        ingredientId,
        grams,
        preparationId
      }))
    });
  }

  private async selectDishRows(
    db: FlavorPilotDatabase,
    condition: SQL | undefined,
    limit: number
  ): Promise<DishSelectRow[]> {
    return db
      .select({
        id: dishes.id,
        ownerId: dishes.ownerId,
        name: dishes.name,
        goal: dishes.goal,
        visibility: dishes.visibility,
        shareToken: dishes.shareToken,
        parentDishId: dishes.parentDishId,
        description: dishes.description,
        imageUrl: dishes.imageUrl,
        publishedAt: dishes.publishedAt,
        createdAt: dishes.createdAt,
        updatedAt: dishes.updatedAt,
        ownerUsername: profiles.username,
        ownerDisplayName: profiles.displayName,
        ownerAvatarUrl: profiles.avatarUrl
      })
      .from(dishes)
      .leftJoin(profiles, eq(profiles.id, dishes.ownerId))
      .where(condition)
      .orderBy(desc(dishes.publishedAt), desc(dishes.updatedAt))
      .limit(limit);
  }

  private async selectDishRow(
    db: FlavorPilotDatabase,
    condition: SQL
  ): Promise<DishSelectRow | undefined> {
    const [row] = await this.selectDishRows(db, condition, 1);
    return row;
  }

  private async loadSerializedDish(
    db: FlavorPilotDatabase,
    row: DishSelectRow,
    exposeShareToken: boolean
  ): Promise<DishResponse> {
    const items = await db
      .select()
      .from(dishItems)
      .where(eq(dishItems.dishId, row.id))
      .orderBy(dishItems.position);
    return this.serializeDish(row, items, exposeShareToken);
  }

  private async loadItems(
    db: FlavorPilotDatabase,
    dishIds: string[]
  ): Promise<Map<string, DishItemRow[]>> {
    const result = new Map<string, DishItemRow[]>();
    if (dishIds.length === 0) return result;

    const rows = await db
      .select()
      .from(dishItems)
      .where(inArray(dishItems.dishId, dishIds))
      .orderBy(dishItems.dishId, dishItems.position);

    for (const row of rows) {
      const group = result.get(row.dishId) ?? [];
      group.push(row);
      result.set(row.dishId, group);
    }
    return result;
  }

  private serializeDish(
    row: DishSelectRow,
    items: DishItemRow[],
    exposeShareToken: boolean
  ): DishResponse {
    return {
      id: row.id,
      ownerId: row.ownerId,
      name: row.name,
      goal: row.goal,
      visibility: row.visibility,
      ...(exposeShareToken ? { shareToken: row.shareToken } : {}),
      parentDishId: row.parentDishId,
      description: row.description,
      imageUrl: row.imageUrl,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      owner: row.ownerUsername
        ? {
            id: row.ownerId,
            username: row.ownerUsername,
            displayName: row.ownerDisplayName,
            avatarUrl: row.ownerAvatarUrl
          }
        : undefined,
      items: items.map((item) => ({
        id: item.id,
        ingredientId: item.ingredientId,
        grams: Number(item.grams),
        preparationId: item.preparationId,
        position: item.position,
        note: item.note
      }))
    };
  }

  private async assertParentDishAccessible(ownerId: string, parentDishId: string | null) {
    if (!parentDishId) return;
    const db = this.database.requireDatabase();
    const [parent] = await db
      .select({ ownerId: dishes.ownerId, visibility: dishes.visibility })
      .from(dishes)
      .where(eq(dishes.id, parentDishId))
      .limit(1);

    if (!parent || (parent.visibility !== "public" && parent.ownerId !== ownerId)) {
      throw new BadRequestException({
        code: "INVALID_PARENT_DISH",
        message: "A remix parent must be public or owned by the authenticated user"
      });
    }
  }

  private async assertPrivateDishCapacity(
    ownerId: string,
    visibility: DishVisibility,
    excludeDishId?: string
  ) {
    if (visibility !== "private") return;
    const db = this.database.requireDatabase();

    const [subscription] = await db
      .select({
        tier: subscriptions.tier,
        status: subscriptions.status,
        currentPeriodEnd: subscriptions.currentPeriodEnd
      })
      .from(subscriptions)
      .where(eq(subscriptions.userId, ownerId))
      .limit(1);

    if (hasActivePaidEntitlement(subscription)) return;

    const predicates: SQL[] = [
      eq(dishes.ownerId, ownerId),
      eq(dishes.visibility, "private")
    ];
    if (excludeDishId) predicates.push(ne(dishes.id, excludeDishId));

    const [result] = await db
      .select({ total: count() })
      .from(dishes)
      .where(and(...predicates));

    if (Number(result?.total ?? 0) >= 3) {
      throw new ConflictException({
        code: "FREE_PRIVATE_DISH_LIMIT_REACHED",
        message: "The Free plan includes up to three private dishes"
      });
    }
  }

  private async replaceItems(
    tx: DishMutationExecutor,
    dishId: string,
    items: DishItem[]
  ) {
    await tx.delete(dishItems).where(eq(dishItems.dishId, dishId));
    if (items.length === 0) return;
    await tx.insert(dishItems).values(
      items.map((item, position) => ({
        dishId,
        ingredientId: item.ingredientId,
        grams: item.grams.toString(),
        preparationId: item.preparationId,
        position
      }))
    );
  }

  private snapshot(input: {
    name: string;
    goal: DishResponse["goal"];
    visibility: DishVisibility;
    description?: string | null;
    imageUrl?: string | null;
    parentDishId?: string | null;
    items: DishItem[];
  }): DishSnapshot {
    return {
      name: input.name,
      goal: input.goal,
      visibility: input.visibility,
      description: input.description ?? null,
      imageUrl: input.imageUrl ?? null,
      parentDishId: input.parentDishId ?? null,
      items: input.items
    };
  }

  private notFound() {
    return new NotFoundException({
      code: "DISH_NOT_FOUND",
      message: "The requested dish was not found or is not visible to this user"
    });
  }

  private translateDatabaseError(error: unknown): never | void {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("FREE_PRIVATE_DISH_LIMIT_REACHED")) {
      throw new ConflictException({
        code: "FREE_PRIVATE_DISH_LIMIT_REACHED",
        message: "The Free plan includes up to three private dishes"
      });
    }
    if (message.includes("INVALID_PARENT_DISH")) {
      throw new BadRequestException({
        code: "INVALID_PARENT_DISH",
        message: "A remix parent must be public or owned by the authenticated user"
      });
    }
    if (message.includes("IMMUTABLE_PARENT_DISH")) {
      throw new ConflictException({
        code: "IMMUTABLE_PARENT_DISH",
        message: "Remix ancestry cannot be changed after a dish is created"
      });
    }
    if (message.includes("UNSUPPORTED_DISH_ITEM")) {
      throw new BadRequestException({
        code: "UNSUPPORTED_DISH_ITEM",
        message: "The ingredient and preparation combination is not supported"
      });
    }
    if (message.includes("DISH_ITEM_LIMIT_REACHED")) {
      throw new BadRequestException({
        code: "DISH_ITEM_LIMIT_REACHED",
        message: "A dish can contain at most 24 ingredient/preparation rows"
      });
    }
    if (message.includes("dish_items_unique_ingredient_idx")) {
      throw new ConflictException({
        code: "DUPLICATE_DISH_ITEM",
        message: "A dish cannot contain the same ingredient and preparation twice"
      });
    }
  }
}
