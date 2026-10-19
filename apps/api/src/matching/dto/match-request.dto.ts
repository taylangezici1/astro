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

import { ASPECTS, type AspectName, type SynastryRule } from "../golden-degree";

const PLANET_KEYS: PlanetKey[] = [
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
];

const ASPECT_NAMES = Object.keys(ASPECTS) as AspectName[];

const PARTIES: Party[] = ["self", "other"];

export class SynastryRuleDto implements SynastryRule {
  @IsIn(PLANET_KEYS)
  self!: PlanetKey;

  @IsIn(ASPECT_NAMES)
  aspect!: AspectName;

  @IsIn(PLANET_KEYS)
  other!: PlanetKey;
}

export class HouseRuleDto implements HouseRule {
  @IsIn(PARTIES)
  planetOf!: Party;

  @IsIn(PLANET_KEYS)
  planet!: PlanetKey;

  @IsIn(PARTIES)
  houseOf!: Party;

  @IsInt()
  @Min(1)
  @Max(12)
  house!: number;
}

export class MatchRequestDto {
  /** Custom synastry rules. Falls back to DEFAULT_RULES when omitted. */
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => SynastryRuleDto)
  rules?: SynastryRuleDto[];

  /** Orb tolerance in degrees. Defaults to 5°. */
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(10)
  orb?: number;

  /** Limit on returned candidate timestamps. */
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5000)
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
