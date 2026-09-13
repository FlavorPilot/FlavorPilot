import { Module } from '@nestjs/common';
import { FlavorModule } from '../flavor/flavor.module';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
@Module({ imports: [FlavorModule], providers: [AiService], controllers: [AiController] })
export class AiModule {
}
