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

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: "birthLocalTime must be HH:MM (00:00–23:59)" })
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
