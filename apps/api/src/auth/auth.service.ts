/**
 * Email + password auth.
 *
 * Signup is the heavy operation: we resolve the user's timezone, compute the
 * natal chart once, and persist all of it on the User row. Login + token
 * issuance are simple bcrypt verifies and JwtService.signAsync calls.
 *
 * The wire shape (`AuthResponse.user`) never includes the password hash —
 * `toPublicUser` strips it.
 */

import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { calcChart } from "@synastry/ephemeris";
import type { AuthResponse, User as PublicUser } from "@synastry/api-types";
import type { User as PrismaUser } from "@synastry/database";

import { PRISMA, type PrismaInstance } from "../prisma/prisma.module";
import { TimezoneService } from "../timezone/timezone.service";
import { DistrictsService } from "../districts/districts.service";
import type { SignupDto } from "./dto/signup.dto";
import type { LoginDto } from "./dto/login.dto";

const BCRYPT_ROUNDS = 10;

interface UserWithDistrict extends PrismaUser {
  district: { id: string; name: string; province: string; latitude: number; longitude: number } | null;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly timezone: TimezoneService,
    private readonly districts: DistrictsService,
    @Inject(PRISMA) private readonly prisma: PrismaInstance,
  ) {}

  async signup(dto: SignupDto): Promise<AuthResponse> {
    const email = dto.email.trim().toLowerCase();

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException("Email already registered");
    }

    // Resolve birth instant + timezone using the same path /match used to.
    const resolved = this.timezone.resolveLocalInstant({
      localDate: dto.birthLocalDate,
      localTime: dto.birthLocalTime,
      latitude: dto.latitude,
      longitude: dto.longitude,
    });

    // Compute the natal chart once and cache it on the row.
    const natal = calcChart(resolved.utc);

    // If the client passed a districtId, verify it exists in the cached
    // catalogue. Anything unknown is silently dropped (the raw lat/lng on the
    // user row is the source of truth).
    let districtIdToStore: string | null = null;
    if (dto.districtId) {
      const all = this.districts.all();
      const hit = all.find((d) => d.id === dto.districtId);
      if (hit) districtIdToStore = hit.id;
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        birthLocalDate: dto.birthLocalDate,
        birthLocalTime: dto.birthLocalTime,
        latitude: dto.latitude,
        longitude: dto.longitude,
        birthTimezone: resolved.timezone,
        birthUtc: resolved.utc,
        districtId: districtIdToStore,
        natalSun: natal.sun,
        natalMoon: natal.moon,
        natalMercury: natal.mercury,
        natalVenus: natal.venus,
        natalMars: natal.mars,
        natalJupiter: natal.jupiter,
        natalSaturn: natal.saturn,
      },
      include: { district: true },
    });

    this.logger.log(`signup: ${user.email}`);
    return this.issueAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { district: true },
    });
    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException("Invalid email or password");
    }

    return this.issueAuthResponse(user);
  }

  /**
   * Loads the user from the DB and shapes them for the wire. Used by the
   * JwtStrategy after token validation.
   */
  async findById(id: string): Promise<UserWithDistrict | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: { district: true },
    });
  }

  /** Strip private fields and return the wire-format user. */
  toPublicUser(user: UserWithDistrict): PublicUser {
    return {
      id: user.id,
      email: user.email,
      birthLocalDate: user.birthLocalDate,
      birthLocalTime: user.birthLocalTime,
      birthTimezone: user.birthTimezone,
      birthUtcISO: user.birthUtc.toISOString(),
      latitude: user.latitude,
      longitude: user.longitude,
      district: user.district
        ? {
            id: user.district.id,
            name: user.district.name,
            province: user.district.province,
            latitude: user.district.latitude,
            longitude: user.district.longitude,
          }
        : null,
      natal: {
        sun: user.natalSun,
        moon: user.natalMoon,
        mercury: user.natalMercury,
        venus: user.natalVenus,
        mars: user.natalMars,
        jupiter: user.natalJupiter,
        saturn: user.natalSaturn,
      },
    };
  }

  private async issueAuthResponse(user: UserWithDistrict): Promise<AuthResponse> {
    const token = await this.jwt.signAsync({ sub: user.id, email: user.email });
    return { token, user: this.toPublicUser(user) };
  }
}

