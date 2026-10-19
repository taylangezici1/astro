import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { RefinementModule } from "../refinement/refinement.module";
import { MatchingController } from "./matching.controller";
import { MatchingService } from "./matching.service";

@Module({
  // AuthModule provides AuthService → JwtStrategy → JwtAuthGuard plumbing.
  imports: [AuthModule, RefinementModule],
  controllers: [MatchingController],
  providers: [MatchingService],
})
export class MatchingModule {}
