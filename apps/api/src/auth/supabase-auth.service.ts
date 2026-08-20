import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { z } from "zod";
import type { AuthenticatedUser } from "./auth.types";

const supabaseUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().optional(),
  role: z.string().optional(),
  user_metadata: z.record(z.string(), z.unknown()).optional()
});

@Injectable()
export class SupabaseAuthService {
  constructor(private readonly config: ConfigService) {}

  async verifyAccessToken(token: string): Promise<AuthenticatedUser> {
    const supabaseUrl = this.config.get<string>("SUPABASE_URL")?.replace(/\/$/, "");
    const publishableKey = this.config.get<string>("SUPABASE_PUBLISHABLE_KEY");

    if (!supabaseUrl || !publishableKey) {
      throw new ServiceUnavailableException({
        code: "AUTH_NOT_CONFIGURED",
        message: "Supabase authentication is not configured on the API"
      });
    }

    let response: Response;
    try {
      response = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: publishableKey
        },
        signal: AbortSignal.timeout(10_000)
      });
    } catch {
      throw new ServiceUnavailableException({
        code: "AUTH_PROVIDER_UNAVAILABLE",
        message: "The authentication provider could not be reached"
      });
    }

    if (response.status === 401 || response.status === 403) {
      throw new UnauthorizedException({
        code: "INVALID_ACCESS_TOKEN",
        message: "The bearer token is invalid or expired"
      });
    }
    if (!response.ok) {
      throw new ServiceUnavailableException({
        code: "AUTH_PROVIDER_ERROR",
        message: "The authentication provider returned an unexpected response"
      });
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new ServiceUnavailableException({
        code: "AUTH_PROVIDER_INVALID_RESPONSE",
        message: "The authentication provider returned invalid JSON"
      });
    }

    const parsed = supabaseUserSchema.safeParse(payload);
    if (!parsed.success) {
      throw new ServiceUnavailableException({
        code: "AUTH_PROVIDER_INVALID_RESPONSE",
        message: "The authentication provider returned an invalid user payload"
      });
    }

    return {
      id: parsed.data.id,
      email: parsed.data.email,
      role: parsed.data.role,
      userMetadata: parsed.data.user_metadata ?? {}
    };
  }
}
