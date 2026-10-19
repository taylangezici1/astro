import { IsString, MaxLength } from "class-validator";
import type { DeleteAccountRequest } from "@synastry/api-types";

export class DeleteAccountDto implements DeleteAccountRequest {
  @IsString()
  @MaxLength(128)
  password!: string;
}
