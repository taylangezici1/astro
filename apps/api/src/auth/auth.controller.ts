import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import type { AuthResponse, User as PublicUser } from "@synastry/api-types";
import type { User as PrismaUser } from "@synastry/database";

import { AuthService } from "./auth.service";
import { SignupDto } from "./dto/signup.dto";
import { LoginDto } from "./dto/login.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";

interface UserWithDistrict extends PrismaUser {
  district: {
    id: string;
    name: string;
    province: string;
    latitude: number;
    longitude: number;
  } | null;
}

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("signup")
  signup(@Body() dto: SignupDto): Promise<AuthResponse> {
    return this.auth.signup(dto);
  }

  @Post("login")
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
}
