import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AiModule } from "./ai/ai.module";
import { AuthModule } from "./auth/auth.module";
import { validateEnvironment } from "./config/environment";
import { DatabaseModule } from "./database/database.module";
import { DishesModule } from "./dishes/dishes.module";
import { FlavorModule } from "./flavor/flavor.module";
import { HealthModule } from "./health/health.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: [".env", "apps/api/.env"],
      validate: validateEnvironment
    }),
    DatabaseModule,
    AuthModule,
    HealthModule,
    FlavorModule,
    AiModule,
    DishesModule
  ]
})
export class AppModule {}
