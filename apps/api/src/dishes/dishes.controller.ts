import { Body, Controller, Delete, Get, Header, HttpCode, Param, Patch, Post, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { createDishRequestSchema, updateDishRequestSchema, publicDishListQuerySchema, remixDishRequestSchema } from '@flavorpilot/contracts';
import { parseInput } from '../common/zod';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { DishesService } from './dishes.service';
@ApiTags('dishes')
@Controller('dishes')
export class DishesController {
    constructor(private readonly dishes: DishesService) { }
    @Get('public')
    @Header('Cache-Control', 'no-store')
    listPublic(
    @Query()
    query: unknown) { return this.dishes.listPublic(parseInput(publicDishListQuerySchema, query)); }
    @Get('public/:id')
    @Header('Cache-Control', 'no-store')
    getPublic(
    @Param('id', new ParseUUIDPipe())
    id: string) { return this.dishes.getPublic(id); }
    @Get('share/:token')
    @Header('Cache-Control', 'no-store')
    @Header('Referrer-Policy', 'no-referrer')
    @Header('X-Robots-Tag', 'noindex, nofollow')
    shared(
    @Param('token', new ParseUUIDPipe())
    token: string) { return this.dishes.getByShareToken(token); }
    @Get('me')
    @UseGuards(SupabaseAuthGuard)
    @ApiBearerAuth()
    @Header('Cache-Control', 'no-store')
    mine(
    @CurrentUser()
    user: AuthenticatedUser) { return this.dishes.listMine(user.id); }
    @Get('me/:id')
    @UseGuards(SupabaseAuthGuard)
    @ApiBearerAuth()
    @Header('Cache-Control', 'no-store')
    own(
    @CurrentUser()
    user: AuthenticatedUser, 
    @Param('id', new ParseUUIDPipe())
    id: string) { return this.dishes.getMine(user.id, id); }
    @Post()
    @UseGuards(SupabaseAuthGuard)
    @ApiBearerAuth()
    @Header('Cache-Control', 'no-store')
    create(
    @CurrentUser()
    user: AuthenticatedUser, 
    @Body()
    body: unknown) { return this.dishes.create(user.id, parseInput(createDishRequestSchema, body)); }
    @Patch(':id')
    @UseGuards(SupabaseAuthGuard)
    @ApiBearerAuth()
    @Header('Cache-Control', 'no-store')
    update(
    @CurrentUser()
    user: AuthenticatedUser, 
    @Param('id', new ParseUUIDPipe())
    id: string, 
    @Body()
    body: unknown) { return this.dishes.update(user.id, id, parseInput(updateDishRequestSchema, body)); }
    @Delete(':id')
    @HttpCode(204)
    @UseGuards(SupabaseAuthGuard)
    @ApiBearerAuth()
    async remove(
    @CurrentUser()
    user: AuthenticatedUser, 
    @Param('id', new ParseUUIDPipe())
    id: string) { await this.dishes.delete(user.id, id); }
    @Post(':id/remix')
    @UseGuards(SupabaseAuthGuard)
    @ApiBearerAuth()
    @Header('Cache-Control', 'no-store')
    remix(
    @CurrentUser()
    user: AuthenticatedUser, 
    @Param('id', new ParseUUIDPipe())
    id: string, 
    @Body()
    body: unknown) { return this.dishes.remix(user.id, id, parseInput(remixDishRequestSchema, body)); }
}
