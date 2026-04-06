import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'required_permission';

/**
 * Require a specific permission key to access a route.
 *
 * Works in tandem with {@link PermissionsGuard}. Permission keys support both
 * dot (`patients.view`) and colon (`patients:view`) formats — the guard
 * normalizes them.
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard, PermissionsGuard)
 *   @RequirePermission('patients.view')
 */
export const RequirePermission = (...permissions: string[]) =>
  SetMetadata(PERMISSION_KEY, permissions);
