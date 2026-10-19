import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";
import type { SignupRequest } from "@synastry/api-types";

import { BirthDetailsDto } from "./birth-details.dto";

export class SignupDto extends BirthDetailsDto implements SignupRequest {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
