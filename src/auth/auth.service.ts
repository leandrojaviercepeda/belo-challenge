import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { AuthRegisterDto } from './dto/auth-register.dto';
import { AuthLoginDto } from './dto/auth-login.dto';
import { User, UserRole } from '../users/user.entity';

/**
 * Payload del token JWT.
 * @property sub - ID del usuario
 * @property email - Email del usuario
 * @property role - Rol del usuario (user o admin)
 */
export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

/**
 * Servicio de autenticación.
 * Maneja registro, login y generación de tokens JWT.
 */
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Registra un nuevo usuario en el sistema.
   * @param authRegisterDto - Datos de registro del usuario
   * @returns Tokens de acceso y usuario creado
   * @throws ConflictException si el email ya existe
   */
  async register(authRegisterDto: AuthRegisterDto) {
    const existingUser = await this.usersService.findByEmail(
      authRegisterDto.email,
    );

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const user = await this.usersService.create(authRegisterDto);

    return this.generateTokens(user);
  }

  /**
   * Autentica un usuario y genera tokens JWT.
   * @param authLoginDto - Credenciales del usuario
   * @returns Tokens de acceso si las credenciales son válidas
   * @throws UnauthorizedException si las credenciales son inválidas
   */
  async login(authLoginDto: AuthLoginDto) {
    const user = await this.usersService.findByEmail(authLoginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await user.validatePassword(authLoginDto.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  /**
   * Valida un usuario por su ID.
   * @param userId - ID del usuario a validar
   * @returns Usuario si existe, null si no
   */
  async validateUser(userId: string): Promise<User | null> {
    return this.usersService.findById(userId);
  }

  /**
   * Obtiene el perfil de un usuario.
   * @param userId - ID del usuario
   * @returns Perfil del usuario con sus datos
   * @throws UnauthorizedException si el usuario no existe
   */
  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      balance: user.balance,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private generateTokens(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role || UserRole.USER,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRES_IN') || '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d',
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
    };
  }
}
