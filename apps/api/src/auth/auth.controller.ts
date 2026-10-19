import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import type { AuthResponse, User as PublicUser } from "@synastry/api-types";

import { AuthService, type UserWithDistrict } from "./auth.service";
import { SignupDto } from "./dto/signup.dto";
import { LoginDto } from "./dto/login.dto";
import { BirthDetailsDto } from "./dto/birth-details.dto";
import { DeleteAccountDto } from "./dto/delete-account.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";

/** Password-guessing endpoints: 10 attempts per minute per IP. */
const STRICT = { default: { limit: 10, ttl: 60_000 } };

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("signup")
  @Throttle(STRICT)
  signup(@Body() dto: SignupDto): Promise<AuthResponse> {
    return this.auth.signup(dto);
  }

  @Post("login")
  @HttpCode(200)
  @Throttle(STRICT)
  login(@Body() dto: LoginDto): Promise<AuthResponse> {
    return this.auth.login(dto);
  }

  /**
   * Returns the current user. Useful for the mobile app to verify a stored
   * token at boot before showing the authenticated UI.
   */
  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@Req() req: Request): PublicUser {
    return this.auth.toPublicUser(req.user as UserWithDistrict);
  }

  /** Replace the birth details; the natal chart is recomputed. */
  @UseGuards(JwtAuthGuard)
  @Patch("me")
  updateBirth(@Req() req: Request, @Body() dto: BirthDetailsDto): Promise<PublicUser> {
    return this.auth.updateBirth((req.user as UserWithDistrict).id, dto);
  }

  /** Permanently delete the account (App Store guideline 5.1.1(v)). */
  @UseGuards(JwtAuthGuard)
  @Delete("me")
  @HttpCode(204)
  @Throttle(STRICT)
  deleteAccount(@Req() req: Request, @Body() dto: DeleteAccountDto): Promise<void> {
    return this.auth.deleteAccount(req.user as UserWithDistrict, dto.password);
  }
}
