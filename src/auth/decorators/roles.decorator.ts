import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../users/user.entity';

/**
 * Key para metadata de roles.
 */
export const ROLES_KEY = 'roles';

/**
 * Decorador para especificar roles requeridos en un endpoint.
 * @param roles - Roles permitidos para acceder al endpoint
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
