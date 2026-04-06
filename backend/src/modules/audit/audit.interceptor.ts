import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip, headers } = request;
    const user = request.user;
    const userAgent = headers['user-agent'] || null;

    const controller = context.getClass().name;
    const handler = context.getHandler().name;

    const entityType = controller.replace('Controller', '').toLowerCase();
    const action = `${entityType}.${handler}`;

    const entityId = request.params?.id || null;

    return next.handle().pipe(
      tap(() => {
        if (user?.id) {
          this.auditService.log({
            userId: user.id,
            action,
            entityType,
            entityId,
            details: {
              method,
              url,
            },
            ipAddress: ip,
            userAgent,
          });
        }
      }),
    );
  }
}
