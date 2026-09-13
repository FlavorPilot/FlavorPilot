import { dishResponseSchema, publicDishListResponseSchema, createDishRequestSchema, updateDishRequestSchema, type CreateDishRequest, type UpdateDishRequest, type DishResponse } from '@flavorpilot/contracts';
import { request } from '@/shared/api';
import type { Recipe } from '../model/types';
export const fromServer = (dish: DishResponse): Recipe => ({
    id: dish.id, name: dish.name, items: dish.items.map(({ ingredientId, preparationId, grams }) => ({ ingredientId, preparationId, grams })),
    goal: dish.goal, visibility: dish.visibility, createdAt: dish.createdAt, origin: 'cloud',
    ...(dish.parentDishId ? { parentDishId: dish.parentDishId } : {}),
    ...(dish.owner ? { author: dish.owner.displayName || dish.owner.username } : {}),
    ...(dish.shareToken ? { shareToken: dish.shareToken } : {}),
});
export const dishRepository = {
    async mine(token: string, signal?: AbortSignal) { return (await request('/dishes/me', v => dishResponseSchema.array().parse(v), { token, signal })).map(fromServer); },
    async publicList(search = '', cursor?: string, signal?: AbortSignal) {
        const query = new URLSearchParams({ search, limit: '20' });
        if (cursor)
            query.set('cursor', cursor);
        const result = await request(`/dishes/public?${query}`, v => publicDishListResponseSchema.parse(v), { signal });
        return { items: result.items.map(fromServer), nextCursor: result.nextCursor };
    },
    async publicOne(id: string) { return fromServer(await request(`/dishes/public/${encodeURIComponent(id)}`, v => dishResponseSchema.parse(v))); },
    async ownOne(id: string, token: string) { return fromServer(await request(`/dishes/me/${encodeURIComponent(id)}`, v => dishResponseSchema.parse(v), { token })); },
    async shared(token: string) { return fromServer(await request(`/dishes/share/${encodeURIComponent(token)}`, v => dishResponseSchema.parse(v))); },
    async create(input: CreateDishRequest, token: string) { return fromServer(await request('/dishes', v => dishResponseSchema.parse(v), { method: 'POST', body: createDishRequestSchema.parse(input), token })); },
    async update(id: string, input: UpdateDishRequest, token: string) { return fromServer(await request(`/dishes/${encodeURIComponent(id)}`, v => dishResponseSchema.parse(v), { method: 'PATCH', body: updateDishRequestSchema.parse(input), token })); },
    async remove(id: string, token: string) { await request(`/dishes/${encodeURIComponent(id)}`, () => undefined, { method: 'DELETE', token }); },
};
