import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ActiveTenantGuard } from '../common/guards/active-tenant.guard';
import { AuditService } from './audit.service';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.type';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

@Controller('audit')
@UseGuards(JwtAuthGuard, ActiveTenantGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  list(@Req() req: AuthenticatedRequest, @Query() query: PaginationQueryDto) {
    return this.auditService.list(
      req.pharmacyId ?? req.user.pharmacyId,
      query.page ? Number(query.page) : 1,
      query.limit ? Number(query.limit) : 10,
    );
  }
}
