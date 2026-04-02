import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import type { AuthenticatedRequest } from '../types/authenticated-request.type';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.user?.pharmacyId) {
      throw new ForbiddenException('Tenant context is required');
    }

    request.pharmacyId = request.user.pharmacyId;
    return true;
  }
}
