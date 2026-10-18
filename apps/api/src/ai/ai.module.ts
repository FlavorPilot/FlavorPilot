import { AiAccessService } from './ai-access.service';
import { AiAccessGuard } from './ai-access.guard';
import { AiGuestController } from './ai.controller';
import { Module } from '@nestjs/common';
import { FlavorModule } from '../flavor/flavor.module';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AccountCapabilitiesController } from './ai.controller';
import { AiUsageService } from './ai-usage.service';
@Module({ imports: [FlavorModule], providers: [AiService,AiUsageService,AiAccessService,AiAccessGuard], controllers: [AiController,AccountCapabilitiesController,AiGuestController], exports:[AiUsageService] })
export class AiModule {
}
