import { Module } from '@nestjs/common';
import { AdminAccessController, AdminController, SupportController } from './admin.controller';
import { AdminGuard, AdminMfaGuard } from './admin.guard';
import { AdminService } from './admin.service';
import { SupportService } from './support.service';
@Module({controllers:[AdminAccessController,AdminController,SupportController],providers:[AdminGuard,AdminMfaGuard,AdminService,SupportService]})
export class AdminModule {}
