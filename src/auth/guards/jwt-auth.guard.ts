import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard de autenticación JWT.
 * Valida el token JWT en las solicitudes entrantes.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
