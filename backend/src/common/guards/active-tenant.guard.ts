import { ForbiddenException, Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type { AuthenticatedRequest } from '../types/authenticated-request.type';

@Injectable()
export class ActiveTenantGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const pharmacyId = request.user?.pharmacyId;

    if (!pharmacyId) {
      throw new ForbiddenException('Tenant context is required');
    }

    const pharmacy = await this.prisma.pharmacy.findUnique({
      where: { id: pharmacyId },
      select: {
        id: true,
        isActive: true,
        plan: true,
        subscriptions: {
          where: { status: SubscriptionStatus.ACTIVE },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { status: true, expiresAt: true },
        },
      },
    });

    if (!pharmacy || !pharmacy.isActive) {
      throw new ForbiddenException('Pharmacy is inactive');
    }

    const subscription = pharmacy.subscriptions[0];
    if (!subscription || subscription.expiresAt.getTime() < Date.now()) {
      throw new ForbiddenException('Subscription is inactive');
    }

    request.pharmacyId = pharmacy.id;
    request.pharmacy = {
      id: pharmacy.id,
      isActive: pharmacy.isActive,
      plan: pharmacy.plan,
    };

    return true;
  }
}
