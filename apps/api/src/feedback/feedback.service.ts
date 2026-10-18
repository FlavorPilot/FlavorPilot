import { createHash } from 'node:crypto';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { CommentListQuery, CommentListResponse, CommentResponse, FeedbackRecipeSnapshot, ModelFeedbackResponse, NormalizedCreateCommentRequest, NormalizedModelFeedbackRequest } from '@flavorpilot/contracts';
import { analyzeDish, MODEL_VERSION, CATALOGUE_VERSION } from '@flavorpilot/flavor-engine';
import { desc, eq, inArray, lt, max, or, type SQL } from 'drizzle-orm';
import { allOf } from '../common/sql';
import { assertValidDishItems } from '../common/catalog-validation';
import { DatabaseService, type FlavorPilotDatabase } from '../database/database.service';
import { dishes, dishVersions, modelFeedback, dishComments, profiles } from '../database/schema';

/** Stable input order also normalizes optional fields on older dish-version snapshots. */
export const feedbackRecipeKey = (recipe: FeedbackRecipeSnapshot) => JSON.stringify({
    name: recipe.name, description: recipe.description, servings: recipe.servings, steps: recipe.steps,
    goal: recipe.goal, items: recipe.items.map(({ ingredientId, grams, preparationId }) => ({ ingredientId, grams, preparationId })),
});
@Injectable()
export class FeedbackService {
    constructor(private readonly database: DatabaseService) {}
    async saveFeedback(authorId: string, input: NormalizedModelFeedbackRequest): Promise<ModelFeedbackResponse> {
        if (input.modelVersion !== MODEL_VERSION || input.catalogueVersion !== CATALOGUE_VERSION)
            throw new ConflictException({ code: 'MODEL_VERSION_CHANGED', message: 'Reload the current model before submitting feedback' });
        assertValidDishItems(input.recipe.items);
        const analysis = analyzeDish(input.recipe.items, input.recipe.goal, false);
        const recipe = JSON.parse(feedbackRecipeKey(input.recipe)) as FeedbackRecipeSnapshot;
        const db = this.database.requireDatabase();
        const record = await db.transaction(async tx => {
            let dishVersionNumber: number | null = null;
            if (input.dishId) {
                const [dish] = await tx.select({ id: dishes.id }).from(dishes).where(allOf(eq(dishes.id,input.dishId),eq(dishes.ownerId,authorId))).for('update');
                if (!dish) throw this.notFound();
                const [version] = await tx.select().from(dishVersions).where(allOf(eq(dishVersions.dishId,dish.id),...(input.dishVersionNumber ? [eq(dishVersions.versionNumber,input.dishVersionNumber)] : []))).orderBy(desc(dishVersions.versionNumber)).limit(1);
                if (!version && input.dishVersionNumber) throw new ConflictException({code:'DISH_VERSION_CHANGED',message:'The source recipe version is unavailable'});
                if (version) {
                    const original = { ...version.snapshot, description: version.snapshot.description ?? '', servings: null, steps: [] };
                    if (feedbackRecipeKey(original) === feedbackRecipeKey(recipe)) dishVersionNumber = version.versionNumber;
                }
            }
            const snapshotKey = createHash('sha256').update(JSON.stringify([MODEL_VERSION,CATALOGUE_VERSION,input.dishId ?? null,dishVersionNumber,recipe,input.cooked])).digest('hex');
            const [saved] = await tx.insert(modelFeedback).values({ authorId, dishId: input.dishId ?? null, dishVersionNumber, snapshotKey,
                recipeSnapshot: recipe, analysisSnapshot: analysis, modelVersion: MODEL_VERSION, catalogueVersion: CATALOGUE_VERSION,
                cooked: input.cooked, agreement: input.agreement, concerns: input.concerns, note: input.note,
            }).onConflictDoUpdate({ target: [modelFeedback.authorId,modelFeedback.snapshotKey], set: {
                cooked: input.cooked, agreement: input.agreement, concerns: input.concerns, note: input.note, updatedAt: new Date(),
            }}).returning();
            return saved;
        });
        return this.feedbackResponse(record);
    }
    async getFeedback(authorId: string, id: string): Promise<ModelFeedbackResponse> {
        const [row] = await this.database.requireDatabase().select().from(modelFeedback).where(allOf(eq(modelFeedback.id,id),eq(modelFeedback.authorId,authorId))).limit(1);
        if (!row) throw this.notFound();
        return this.feedbackResponse(row);
    }
    async deleteFeedback(authorId: string, id: string) {
        const rows = await this.database.requireDatabase().delete(modelFeedback).where(allOf(eq(modelFeedback.id,id),eq(modelFeedback.authorId,authorId))).returning({id:modelFeedback.id});
        if (!rows.length) throw this.notFound();
    }
    async listComments(dishId: string, query: CommentListQuery): Promise<CommentListResponse> {
        const db = this.database.requireDatabase();
        // Reading and writing lock the recipe so a visibility change cannot cross the authorization check.
        return db.transaction(async tx => {
            const [dish] = await tx.select({id:dishes.id}).from(dishes).where(allOf(eq(dishes.id,dishId),eq(dishes.visibility,'public'))).for('share');
            if (!dish) throw this.notFound();
            const filters: SQL[] = [];
            if (query.cursor) {
                const [time,id] = query.cursor.split('|');
                filters.push(or(lt(dishComments.createdAt,new Date(time)),allOf(eq(dishComments.createdAt,new Date(time)),lt(dishComments.id,id)))!);
            }
            const rows = await tx.select().from(dishComments).where(allOf(eq(dishComments.dishId,dishId),...filters))
                .orderBy(desc(dishComments.createdAt),desc(dishComments.id)).limit(query.limit+1);
            const hasMore = rows.length > query.limit, page = rows.slice(0,query.limit), last = page.at(-1);
            return { items: await this.commentResponses(tx,page), nextCursor: hasMore && last ? `${last.createdAt.toISOString()}|${last.id}` : null,
                versionNumber: await this.currentVersion(tx,dishId) };
        });
    }
    async createComment(authorId: string, dishId: string, input: NormalizedCreateCommentRequest): Promise<CommentResponse> {
        return this.database.requireDatabase().transaction(async tx => {
            const [dish] = await tx.select({id:dishes.id}).from(dishes).where(allOf(eq(dishes.id,dishId),eq(dishes.visibility,'public'))).for('update');
            if (!dish) throw this.notFound();
            const versionNumber = await this.currentVersion(tx,dishId);
            if (input.versionNumber !== versionNumber) throw new ConflictException({code:'DISH_VERSION_CHANGED',message:'The recipe changed. Refresh it before commenting.'});
            if (input.parentId) {
                const [parent] = await tx.select().from(dishComments).where(allOf(eq(dishComments.id,input.parentId),eq(dishComments.dishId,dishId))).limit(1);
                if (!parent || parent.parentId || parent.deletedAt) throw new ConflictException({code:'COMMENT_UNAVAILABLE',message:'The comment cannot receive a reply'});
            }
            const [row] = await tx.insert(dishComments).values({dishId,authorId,parentId:input.parentId ?? null,text:input.text,hasCooked:input.hasCooked,versionNumber,createdAt:new Date()}).returning();
            return (await this.commentResponses(tx,[row]))[0];
        });
    }
    async deleteComment(authorId: string, dishId: string, id: string) {
        // Authors may remove their own words even after a recipe becomes private.
        const rows = await this.database.requireDatabase().update(dishComments).set({text:null,deletedAt:new Date(),hasCooked:false})
            .where(allOf(eq(dishComments.id,id),eq(dishComments.dishId,dishId),eq(dishComments.authorId,authorId))).returning({id:dishComments.id});
        if (!rows.length) throw this.notFound();
    }
    private async currentVersion(db: Pick<FlavorPilotDatabase,'select'>, dishId: string) {
        const [version] = await db.select({n:max(dishVersions.versionNumber)}).from(dishVersions).where(eq(dishVersions.dishId,dishId));
        return Number(version?.n ?? 1);
    }
    private async commentResponses(db: Pick<FlavorPilotDatabase,'select'>, rows: (typeof dishComments.$inferSelect)[]): Promise<CommentResponse[]> {
        if (!rows.length) return [];
        const parentIds = rows.flatMap(row => row.parentId ? [row.parentId] : []);
        const parents = parentIds.length ? await db.select().from(dishComments).where(allOf(inArray(dishComments.id,parentIds),eq(dishComments.dishId,rows[0].dishId))) : [];
        const people = await db.select({id:profiles.id,username:profiles.username,displayName:profiles.displayName,avatarUrl:profiles.avatarUrl}).from(profiles)
            .where(inArray(profiles.id,[...new Set([...rows,...parents].map(row => row.authorId))]));
        const byPerson = new Map(people.map(person => [person.id,person])), byParent = new Map(parents.map(row => [row.id,row]));
        return rows.map(row => {
            const parent = row.parentId ? byParent.get(row.parentId) : undefined;
            const parentAuthor = parent && !parent.deletedAt ? byPerson.get(parent.authorId) : undefined;
            return {id:row.id,parentId:row.parentId,text:row.deletedAt ? null : row.text,hasCooked:row.deletedAt ? false : row.hasCooked,versionNumber:row.versionNumber,
                author:row.deletedAt ? null : byPerson.get(row.authorId) ?? null,
                replyTo:parent ? {authorName:parentAuthor?.displayName || parentAuthor?.username || '',text:parent.deletedAt ? null : parent.text?.slice(0,200) ?? null} : null,
                createdAt:row.createdAt.toISOString(),deleted:Boolean(row.deletedAt)};
        });
    }
    private feedbackResponse(row: typeof modelFeedback.$inferSelect): ModelFeedbackResponse {
        return {id:row.id,dishId:row.dishId,dishVersionNumber:row.dishVersionNumber,recipe:row.recipeSnapshot,analysis:row.analysisSnapshot,modelVersion:row.modelVersion,catalogueVersion:row.catalogueVersion,
            cooked:row.cooked,agreement:row.agreement,concerns:row.concerns,note:row.note,createdAt:row.createdAt.toISOString(),updatedAt:row.updatedAt.toISOString()};
    }
    private notFound() { return new NotFoundException({code:'FEEDBACK_NOT_FOUND',message:'The requested record is not available'}); }
}
