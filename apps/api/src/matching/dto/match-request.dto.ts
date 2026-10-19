import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import type { HouseRule, Party, PlanetKey } from "@synastry/api-types";

import {
  ASPECTS,
  PLANET_KEYS,
  type AspectName,
  type SynastryRule,
} from "../golden-degree";

const ASPECT_NAMES = Object.keys(ASPECTS) as AspectName[];

const PARTIES: Party[] = ["self", "other"];

export class SynastryRuleDto implements SynastryRule {
  @IsIn(PLANET_KEYS as PlanetKey[])
  self!: PlanetKey;

  @IsIn(ASPECT_NAMES)
  aspect!: AspectName;

  @IsIn(PLANET_KEYS as PlanetKey[])
  other!: PlanetKey;
}

export class HouseRuleDto implements HouseRule {
  @IsIn(PARTIES)
  planetOf!: Party;

  @IsIn(PLANET_KEYS as PlanetKey[])
  planet!: PlanetKey;

  @IsIn(PARTIES)
  houseOf!: Party;

  @IsInt()
  @Min(1)
  @Max(12)
  house!: number;
}

export class MatchRequestDto {
  /** Custom synastry rules. Falls back to DEFAULT_SYNASTRY_RULES when omitted. */
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => SynastryRuleDto)
  rules?: SynastryRuleDto[];

  /** Orb tolerance in degrees. Defaults to DEFAULT_ORB (3°). */
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(10)
  orb?: number;

  /** How many Phase 2 candidates (distinct days) to return. Defaults to 50. */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  /** Optional override for the Phase 3 house rule set. */
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => HouseRuleDto)
  houseRules?: HouseRuleDto[];
}
