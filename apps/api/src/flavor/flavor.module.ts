import { Module } from "@nestjs/common";
import { FlavorController } from "./flavor.controller";
import { FlavorService } from "./flavor.service";

@Module({
  controllers: [FlavorController],
  providers: [FlavorService],
  exports: [FlavorService]
})
export class FlavorModule {}
