import { Global, Module } from "@nestjs/common";
import { SupabaseAuthGuard } from "./supabase-auth.guard";
import { SupabaseAuthService } from "./supabase-auth.service";

@Global()
@Module({
  providers: [SupabaseAuthService, SupabaseAuthGuard],
  exports: [SupabaseAuthService, SupabaseAuthGuard]
})
export class AuthModule {}
