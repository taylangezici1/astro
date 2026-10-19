import {
  IsEmail,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";
import { Type } from "class-transformer";

export class SignupDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

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
  districtId?: string;
}
