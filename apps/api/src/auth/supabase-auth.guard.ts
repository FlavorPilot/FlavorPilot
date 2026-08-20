import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import type { AuthenticatedRequest } from "./auth.types";
import { SupabaseAuthService } from "./supabase-auth.service";

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly authService: SupabaseAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      throw new UnauthorizedException({
        code: "AUTHENTICATION_REQUIRED",
        message: "A Supabase bearer token is required"
      });
    }

    const token = authorization.slice("Bearer ".length).trim();
    if (!token) {
      throw new UnauthorizedException({
        code: "AUTHENTICATION_REQUIRED",
        message: "A Supabase bearer token is required"
      });
    }

    (request as AuthenticatedRequest).user = await this.authService.verifyAccessToken(token);
    return true;
  }
}
