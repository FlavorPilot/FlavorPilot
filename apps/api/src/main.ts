import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/all-exceptions.filter";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true, bodyLimit: 1_048_576 }),
    { bufferLogs: true }
  );

  const config = app.get(ConfigService);
  const prefix = config.get<string>("API_PREFIX", "v1");
  const host = config.get<string>("API_HOST", "0.0.0.0");
  const port = config.get<number>("PORT") ?? config.get<number>("API_PORT", 4000);
  const origins = config
    .get<string>("CORS_ORIGINS", "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.setGlobalPrefix(prefix);
  app.enableCors({
    origin: origins.includes("*") ? true : origins,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"]
  });
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();

  if (config.get<boolean>("SWAGGER_ENABLED", true)) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("FlavorPilot API")
      .setDescription(
        "Authoritative API for dishes, privacy, deterministic flavor analysis and optional AI explanations."
      )
      .setVersion("0.3.0")
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("docs", app, document, { jsonDocumentUrl: "docs/openapi.json" });
  }

  await app.listen(port, host);
  Logger.log(`FlavorPilot API listening on http://${host}:${port}/${prefix}`, "Bootstrap");
}

void bootstrap();
