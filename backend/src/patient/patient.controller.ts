import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ActiveTenantGuard } from '../common/guards/active-tenant.guard';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientService } from './patient.service';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.type';

@Controller('patients')
@UseGuards(JwtAuthGuard, ActiveTenantGuard)
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreatePatientDto) {
    return this.patientService.create(req.pharmacyId ?? req.user.pharmacyId, req.user.id, dto);
  }

  @Get()
  list(@Req() req: AuthenticatedRequest, @Query() query: PaginationQueryDto) {
    return this.patientService.list(
      req.pharmacyId ?? req.user.pharmacyId, 
      query.page ?? 1, 
      query.limit ?? 20, 
      query.search
    );
  }

  @Get(':id/history')
  history(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.patientService.getDecryptedHistory(id, req.pharmacyId ?? req.user.pharmacyId);
  }

  @Patch(':id')
  update(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdatePatientDto) {
    return this.patientService.update(id, req.pharmacyId ?? req.user.pharmacyId, req.user.id, dto);
  }

  @Delete(':id')
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.patientService.softDelete(id, req.pharmacyId ?? req.user.pharmacyId, req.user.id);
  }
}
