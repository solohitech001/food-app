import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'supersecret',
    });
  }

  async validate(payload: any) {
    /**
     * Payload coming from JWT looks like:
     * {
     *   sub: userId,
     *   role: 'CUSTOMER',
     *   iat: timestamp,
     *   exp: timestamp
     * }
     */

    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    /**
     * Whatever you return here
     * becomes req.user
     */
    return {
      id: payload.sub,
      role: payload.role,
    };
  }
}
