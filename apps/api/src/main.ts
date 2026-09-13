import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
async function bootstrap() {
    const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter({ trustProxy: false, bodyLimit: 1048576 }), { bufferLogs: true });
    const config = app.get(ConfigService), prefix = config.get<string>('API_PREFIX', 'v1'), host = config.get<string>('API_HOST', '0.0.0.0'), port = config.get<number>('PORT') ?? config.get<number>('API_PORT', 4000);
    const origins = config.get<string>('CORS_ORIGINS', 'http://localhost:3000').split(',').map(s => s.trim()).filter(Boolean);
    app.setGlobalPrefix(prefix);
    app.enableCors({ origin: origins, credentials: true, methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'] });
    app.useGlobalFilters(new AllExceptionsFilter());
    app.enableShutdownHooks();
    if (config.get<boolean>('SWAGGER_ENABLED', true)) {
        const spec = new DocumentBuilder().setTitle('FlavorPilot API').setDescription('Dishes, privacy and experimental deterministic flavor analysis.').setVersion('0.3.0').addBearerAuth().build();
        SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, spec), { jsonDocumentUrl: 'docs/openapi.json' });
    }
    await app.listen(port, host);
    Logger.log(`FlavorPilot API listening on http://${host}:${port}/${prefix}`, 'Bootstrap');
}
bootstrap().catch(error => { Logger.error(error instanceof Error ? error.name : 'Bootstrap failed', 'Bootstrap'); process.exitCode = 1; });
