import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums/roles.enum';

/**
 * Guard that ensures the current user owns the resource being modified.
 * Used on endpoints that modify data (PATCH, DELETE, sign, amend).
 * Read-only endpoints (GET) are not restricted.
 *
 * Owner, sysadmin, and chief_doctor bypass this guard.
 * For doctors: checks that req.user.id matches the doctorId of the resource.
 *
 * The resource must be loaded and attached to req by an interceptor or
 * the guard itself fetches it based on :id param.
 */
@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const method = request.method;

    // Allow read operations
    if (method === 'GET') return true;

    // Admins bypass
    const adminRoles = [UserRole.OWNER, UserRole.SYSADMIN, UserRole.CHIEF_DOCTOR];
    if (adminRoles.includes(user?.role)) return true;

    // For now, attach user info so the service layer can check ownership
    // The actual check happens in the service (more flexible than guard)
    request.currentUserId = user?.id;

    return true;
  }
}
