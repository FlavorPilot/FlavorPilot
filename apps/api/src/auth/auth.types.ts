import type { FastifyRequest } from "fastify";

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role?: string;
  userMetadata: Record<string, unknown>;
}

export interface AuthenticatedRequest extends FastifyRequest {
  user: AuthenticatedUser;
}
