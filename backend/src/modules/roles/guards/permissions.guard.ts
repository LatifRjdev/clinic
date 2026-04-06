import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { RolesService } from '../roles.service';
import { UserRole } from '../../../common/enums/roles.enum';

/**
 * Guard that checks whether the current user's role has a fine-grained
 * permission (e.g. `patients.view`). Built-in OWNER and SYSADMIN roles always
 * pass — they use role-based access via {@link RolesGuard} instead. For all
 * other roles (including custom roles created by admins) the guard resolves
 * the effective permission list through {@link RolesService}.
 *
 * Does NOT replace or interfere with {@link RolesGuard}; the two can be
 * combined on the same handler for layered checks.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rolesService: RolesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      return false;
    }

    // Super-roles bypass the permission matrix.
    if (user.role === UserRole.OWNER || user.role === UserRole.SYSADMIN) {
      return true;
    }

    const granted = await this.rolesService.getPermissionsForRole(user.role);
    const normalizedGranted = new Set(granted.map(normalize));

    const hasAll = required.every((p) => normalizedGranted.has(normalize(p)));
    if (!hasAll) {
      throw new ForbiddenException(
        `Missing required permission: ${required.join(', ')}`,
      );
    }

    return true;
  }
}

/** Normalize both `patients.view` and `patients:view` to the same token. */
function normalize(key: string): string {
  return key.replace(/\./g, ':').toLowerCase();
}
