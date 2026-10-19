import { Global, Module } from "@nestjs/common";
import { TimezoneService } from "./timezone.service";

// Global so any module (matching, future user-profile, refinement) can inject
// it without re-importing the module everywhere.
@Global()
@Module({
  providers: [TimezoneService],
  exports: [TimezoneService],
})
export class TimezoneModule {}
