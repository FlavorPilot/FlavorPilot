import { Module } from '@nestjs/common';
import { FlavorModule } from '../flavor/flavor.module';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AccountCapabilitiesController } from './ai.controller';
import { AiUsageService } from './ai-usage.service';
@Module({ imports: [FlavorModule], providers: [AiService,AiUsageService], controllers: [AiController,AccountCapabilitiesController], exports:[AiUsageService] })
export class AiModule {
}
