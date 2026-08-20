import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  type OnApplicationShutdown
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type TasteCraftDatabase = PostgresJsDatabase<typeof schema>;
export type DatabaseStatus = "connected" | "not_configured" | "unavailable";

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly client?: ReturnType<typeof postgres>;
  readonly db?: TasteCraftDatabase;

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>("DATABASE_URL")?.trim();
    if (!url) {
      this.logger.warn(
        "DATABASE_URL is not configured. Persistence endpoints return 503; flavor analysis remains available."
      );
      return;
    }

    const sslMode = this.config.get<string>("DATABASE_SSL", "auto");
    const isLocal = /localhost|127\.0\.0\.1|host\.docker\.internal/.test(url);
    const ssl =
      sslMode === "disable" ? false : sslMode === "require" ? "require" : isLocal ? false : "require";

    this.client = postgres(url, {
      max: this.config.get<number>("DATABASE_POOL_SIZE", 10),
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
      ssl
    });
    this.db = drizzle(this.client, { schema });
  }

  requireDatabase(): TasteCraftDatabase {
    if (!this.db) {
      throw new ServiceUnavailableException({
        code: "DATABASE_NOT_CONFIGURED",
        message: "Persistence is unavailable until DATABASE_URL is configured"
      });
    }
    return this.db;
  }

  async status(): Promise<DatabaseStatus> {
    if (!this.client) return "not_configured";
    try {
      await this.client`select 1`;
      return "connected";
    } catch (error) {
      this.logger.error(
        `Database health check failed: ${error instanceof Error ? error.message : String(error)}`
      );
      return "unavailable";
    }
  }

  async onApplicationShutdown() {
    await this.client?.end({ timeout: 5 });
  }
}
