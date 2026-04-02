import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { PharmacyService } from './pharmacy.service';
import { OnboardPharmacyDto } from './dto/onboard-pharmacy.dto';
import { UpdatePharmacyDto } from './dto/update-pharmacy.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.type';

@Controller('pharmacies')
export class PharmacyController {
  constructor(private readonly pharmacyService: PharmacyService) {}

  @Post('onboard')
  onboard(@Body() dto: OnboardPharmacyDto) {
    return this.pharmacyService.onboardPharmacy(dto);
  }

  @UseGuards(JwtAuthGuard, TenantGuard)
  @Get(':id')
  findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    if (req.user.pharmacyId !== id) {
      throw new ForbiddenException('Cross-tenant access denied');
    }
    return this.pharmacyService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  update(
    @Req() req: AuthenticatedRequest, 
    @Param('id') id: string, 
    @Body() dto: UpdatePharmacyDto
  ) {
    if (req.user.pharmacyId !== id) {
      throw new ForbiddenException('Cross-tenant updates denied');
    }
    return this.pharmacyService.update(id, dto);
  }
}
