import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

import { AuthService } from "./auth.service";

interface JwtPayload {
  sub: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly auth: AuthService,
  ) {
    const secret = config.get<string>("JWT_SECRET");
    if (!secret) {
      throw new Error(
        "JWT_SECRET is not set. Add it to apps/api/.env before starting the API.",
      );
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  /**
   * Called by passport-jwt after the token signature/exp checks pass. We
   * re-fetch the user from the DB so request handlers can rely on
   * `request.user` being a fresh row (and so that disabled accounts could be
   * blocked here later).
   */
  async validate(payload: JwtPayload) {
    const user = await this.auth.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
