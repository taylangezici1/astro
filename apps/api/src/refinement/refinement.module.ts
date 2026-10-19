import { Module } from "@nestjs/common";
import { DistrictsModule } from "../districts/districts.module";
import { RefinementService } from "./refinement.service";

@Module({
  imports: [DistrictsModule],
  providers: [RefinementService],
  exports: [RefinementService],
})
export class RefinementModule {}
