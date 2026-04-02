import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ActiveTenantGuard } from '../common/guards/active-tenant.guard';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { PrescriptionService } from './prescription.service';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.type';

@Controller('prescriptions')
@UseGuards(JwtAuthGuard, ActiveTenantGuard)
export class PrescriptionController {
  constructor(private readonly prescriptionService: PrescriptionService) {}

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreatePrescriptionDto) {
    return this.prescriptionService.create(
      req.pharmacyId ?? req.user.pharmacyId,
      req.user.id,
      dto,
    );
  }

  @Post('bulk')
  bulkCreate(@Req() req: AuthenticatedRequest, @Body() dtos: CreatePrescriptionDto[]) {
    return this.prescriptionService.bulkCreate(
      req.pharmacyId ?? req.user.pharmacyId,
      req.user.id,
      dtos,
    );
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest, @Query() query: PaginationQueryDto) {
    return this.prescriptionService.findAll(
      req.pharmacyId ?? req.user.pharmacyId, 
      query.page ?? 1, 
      query.limit ?? 20, 
      query.search
    );
  }

  @Get('patient/:patientId')
  history(@Req() req: AuthenticatedRequest, @Param('patientId') patientId: string) {
    return this.prescriptionService.history(patientId, req.pharmacyId ?? req.user.pharmacyId);
  }
}
