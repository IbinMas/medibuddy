import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ActiveTenantGuard } from '../common/guards/active-tenant.guard';
import { AnalyticsService } from './analytics.service';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.type';

@Controller('analytics')
@UseGuards(JwtAuthGuard, ActiveTenantGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  summary(@Req() req: AuthenticatedRequest) {
    return this.analyticsService.summary(req.pharmacyId ?? req.user.pharmacyId);
  }
}
