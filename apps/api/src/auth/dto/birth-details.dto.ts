import {
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from "class-validator";
import { Type } from "class-transformer";
import type { UpdateBirthRequest } from "@synastry/api-types";

/** Birth inputs, shared by signup and PATCH /auth/me. */
export class BirthDetailsDto implements UpdateBirthRequest {
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "birthLocalDate must be YYYY-MM-DD" })
  birthLocalDate!: string;

  @Matches(/^\d{2}:\d{2}$/, { message: "birthLocalTime must be HH:MM" })
  birthLocalTime!: string;

  @IsLatitude()
  @Type(() => Number)
  latitude!: number;

  @IsLongitude()
  @Type(() => Number)
  longitude!: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  districtId?: string;
}
