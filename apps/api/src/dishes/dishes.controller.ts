import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  createDishRequestSchema,
  publicDishListQuerySchema,
  remixDishRequestSchema,
  updateDishRequestSchema,
  type DishResponse,
  type PublicDishListResponse
} from "@flavorpilot/contracts";
import { CurrentUser } from "../auth/current-user.decorator";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import type { AuthenticatedUser } from "../auth/auth.types";
import { parseWithSchema } from "../common/zod";
import { DishesService } from "./dishes.service";

@ApiTags("dishes")
@Controller("dishes")
export class DishesController {
  constructor(private readonly dishesService: DishesService) {}

  @Get("public")
  @ApiOperation({ summary: "Browse public dishes" })
  listPublic(@Query() query: unknown): Promise<PublicDishListResponse> {
    const input = parseWithSchema(publicDishListQuerySchema, query);
    return this.dishesService.listPublic(input);
  }

  @Get("public/:id")
  @ApiOperation({ summary: "Read a public dish" })
  getPublic(@Param("id", new ParseUUIDPipe()) id: string): Promise<DishResponse> {
    return this.dishesService.getPublic(id);
  }

  @Get("share/:token")
  @ApiOperation({ summary: "Read a public or unlisted dish using its opaque token" })
  getShared(@Param("token", new ParseUUIDPipe()) token: string): Promise<DishResponse> {
    return this.dishesService.getByShareToken(token);
  }

  @Get("me")
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List the authenticated user's dishes" })
  listMine(@CurrentUser() user: AuthenticatedUser): Promise<DishResponse[]> {
    return this.dishesService.listMine(user.id);
  }

  @Get("me/:id")
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Read one of the authenticated user's dishes" })
  getMine(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ParseUUIDPipe()) id: string
  ): Promise<DishResponse> {
    return this.dishesService.getMine(user.id, id);
  }

  @Post()
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a dish and its first immutable version" })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown
  ): Promise<DishResponse> {
    const input = parseWithSchema(createDishRequestSchema, body);
    return this.dishesService.create(user.id, input);
  }

  @Patch(":id")
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update a dish and append a version snapshot" })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() body: unknown
  ): Promise<DishResponse> {
    const input = parseWithSchema(updateDishRequestSchema, body);
    return this.dishesService.update(user.id, id, input);
  }

  @Delete(":id")
  @HttpCode(204)
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete an owned dish" })
  delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ParseUUIDPipe()) id: string
  ): Promise<void> {
    return this.dishesService.delete(user.id, id);
  }

  @Post(":id/remix")
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create an attributed remix of a public dish" })
  remix(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() body: unknown
  ): Promise<DishResponse> {
    const input = parseWithSchema(remixDishRequestSchema, body);
    return this.dishesService.remix(user.id, id, input);
  }
}
