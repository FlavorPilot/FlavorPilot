import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnvironment } from './config/environment';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { FlavorModule } from './flavor/flavor.module';
import { AiModule } from './ai/ai.module';
import { DishesModule } from './dishes/dishes.module';
import { HealthModule } from './health/health.module';
@Module({ imports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env'], validate: validateEnvironment }), DatabaseModule, AuthModule, FlavorModule, AiModule, DishesModule, HealthModule] })
export class AppModule {
}
