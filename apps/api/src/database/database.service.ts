import { Injectable, Logger, ServiceUnavailableException, type OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
export type FlavorPilotDatabase = PostgresJsDatabase<typeof schema>;
export type DatabaseStatus = 'connected' | 'not_configured' | 'unavailable';
@Injectable()
export class DatabaseService implements OnApplicationShutdown {
    private readonly logger = new Logger(DatabaseService.name);
    private readonly client?: ReturnType<typeof postgres>;
    readonly db?: FlavorPilotDatabase;
    constructor(private readonly config: ConfigService) {
        const url = config.get<string>('DATABASE_URL')?.trim();
        if (!url) {
            this.logger.warn('DATABASE_URL is not configured. Persistence endpoints return 503; flavor analysis remains available.');
            return;
        }
        const mode = config.get<string>('DATABASE_SSL', 'auto');
        const host = new URL(url).hostname;
        const local = ['localhost', '127.0.0.1', 'host.docker.internal', '[::1]'].includes(host);
        const ssl = mode === 'disable' ? false : mode === 'require' ? 'require' : local ? false : 'require';
        this.client = postgres(url, { max: config.get<number>('DATABASE_POOL_SIZE', 10), idle_timeout: 20, connect_timeout: 10, prepare: false, ssl });
        this.db = drizzle(this.client, { schema });
    }
    requireDatabase(): FlavorPilotDatabase { if (!this.db)
        throw new ServiceUnavailableException({ code: 'DATABASE_NOT_CONFIGURED', message: 'Persistence is unavailable until DATABASE_URL is configured' }); return this.db; }
    async status(): Promise<DatabaseStatus> { if (!this.client)
        return 'not_configured'; try {
        await this.client `select 1`;
        return 'connected';
    }
    catch {
        this.logger.warn('Database health check failed');
        return 'unavailable';
    } }
    async onApplicationShutdown() { await this.client?.end({ timeout: 5 }); }
}
