import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { UserRole } from '../enums/roles.enum';

/**
 * Interceptor that automatically injects branchId from the authenticated user
 * into the request query for non-admin users. Owner and sysadmin see all branches.
 */
@Injectable()
export class BranchInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return next.handle();

    const globalRoles = [UserRole.OWNER, UserRole.SYSADMIN];
    if (globalRoles.includes(user.role)) return next.handle();

    if (user.branchId && !request.query.branchId) {
      request.query.branchId = user.branchId;
    }

    return next.handle();
  }
}
