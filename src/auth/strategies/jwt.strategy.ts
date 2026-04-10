import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { UserRole } from '../../users/user.entity';

/**
 * Payload del token JWT.
 */
interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

/**
 * Usuario validado del token JWT.
 */
export interface ValidatedUser {
  id: string;
  email: string;
  role: UserRole;
}

/**
 * Estrategia JWT para Passport.
 * Valida tokens JWT y extrae el usuario.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('bearer'),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET') || 'change-me-in-production',
    });
  }

  /**
   * Valida el payload del token JWT.
   * @param payload - Payload del token decodificado
   * @returns Datos del usuario validado
   * @throws UnauthorizedException si el usuario no existe
   */
  async validate(payload: JwtPayload) {
    const user = await this.authService.validateUser(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role || user.role || UserRole.USER,
    };
  }
}
