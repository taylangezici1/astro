/**
 * Email + password auth, plus the account's birth details.
 *
 * Signup is the heavy operation: we resolve the user's timezone, compute the
 * natal chart once, and persist all of it on the User row. Login + token
 * issuance are simple bcrypt verifies and JwtService.signAsync calls.
 *
 * The wire shape (`AuthResponse.user`) never includes the password hash —
 * `toPublicUser` strips it.
 */

import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { calcChart } from "@synastry/ephemeris";
import type {
  ApiErrorCode,
  AuthResponse,
  UpdateBirthRequest,
  User as PublicUser,
} from "@synastry/api-types";
import { Prisma, type User as PrismaUser } from "@synastry/database";

import { PRISMA, type PrismaInstance } from "../prisma/prisma.module";
import { TimezoneService } from "../timezone/timezone.service";
import { DISTRICT_TIMEZONE, DistrictsService } from "../districts/districts.service";
import type { SignupDto } from "./dto/signup.dto";
import type { LoginDto } from "./dto/login.dto";

const BCRYPT_ROUNDS = 10;
/** The GlobalSky window starts in 1986; earlier births still get a chart. */
const EARLIEST_BIRTH_YEAR = 1900;

/**
 * Compared against when the email is unknown, so a login for a non-existent
 * account takes as long as one with a wrong password (no user enumeration
 * by timing).
 */
const DUMMY_HASH = bcrypt.hashSync("synastry-timing-equaliser", BCRYPT_ROUNDS);

export interface UserWithDistrict extends PrismaUser {
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

    const birth = this.resolveBirth(dto);
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    let user: UserWithDistrict;
    try {
      user = await this.prisma.user.create({
        data: { email, passwordHash, ...birth },
        include: { district: true },
      });
    } catch (err) {
      // Two signups for the same email racing past the check above.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictException("Email already registered");
      }
      throw err;
    }

    this.logger.log(`signup: ${user.id}`);
    return this.issueAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { district: true },
    });
    const ok = await bcrypt.compare(dto.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok) {
      throw new UnauthorizedException("Invalid email or password");
    }

    return this.issueAuthResponse(user);
  }

  /** Replace the birth details and recompute the cached natal chart. */
  async updateBirth(userId: string, dto: UpdateBirthRequest): Promise<PublicUser> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: this.resolveBirth(dto),
      include: { district: true },
    });
    this.logger.log(`birth details updated: ${user.id}`);
    return this.toPublicUser(user);
  }

  /** Permanently delete the account after re-checking the password. */
  async deleteAccount(user: PrismaUser, password: string): Promise<void> {
    if (!(await bcrypt.compare(password, user.passwordHash))) {
      // Coded, so clients can tell this apart from the guard's 401 for an
      // expired token.
      throw new UnauthorizedException({
        statusCode: 401,
        error: "Unauthorized",
        code: "INVALID_PASSWORD" satisfies ApiErrorCode,
        message: "Invalid password",
      });
    }
    await this.prisma.user.delete({ where: { id: user.id } });
    this.logger.log(`account deleted: ${user.id}`);
  }

  /**
   * Loads the user from the DB. Used by the JwtStrategy after token
   * validation.
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

  /**
   * Resolve birth inputs into the columns stored on User: timezone, UTC
   * instant, and the natal chart, computed once here so matching never has to.
   */
  private resolveBirth(input: UpdateBirthRequest) {
    // Only keep a districtId that exists in the catalogue; the raw lat/lng on
    // the user row is the source of truth either way.
    const district = input.districtId ? this.districts.byId(input.districtId) : undefined;

    const resolved = this.timezone.resolveLocalInstant({
      localDate: input.birthLocalDate,
      localTime: input.birthLocalTime,
      latitude: input.latitude,
      longitude: input.longitude,
      timezone: district ? DISTRICT_TIMEZONE : undefined,
    });
    if (resolved.utc.getTime() > Date.now()) {
      throw new BadRequestException("Birth date is in the future");
    }
    if (resolved.utc.getUTCFullYear() < EARLIEST_BIRTH_YEAR) {
      throw new BadRequestException(`Birth date must be in ${EARLIEST_BIRTH_YEAR} or later`);
    }

    const natal = calcChart(resolved.utc);

    return {
      birthLocalDate: input.birthLocalDate,
      birthLocalTime: input.birthLocalTime,
      latitude: input.latitude,
      longitude: input.longitude,
      birthTimezone: resolved.timezone,
      birthUtc: resolved.utc,
      districtId: district?.id ?? null,
      natalSun: natal.sun,
      natalMoon: natal.moon,
      natalMercury: natal.mercury,
      natalVenus: natal.venus,
      natalMars: natal.mars,
      natalJupiter: natal.jupiter,
      natalSaturn: natal.saturn,
    };
  }

  private async issueAuthResponse(user: UserWithDistrict): Promise<AuthResponse> {
    const token = await this.jwt.signAsync({ sub: user.id });
    return { token, user: this.toPublicUser(user) };
  }
}
