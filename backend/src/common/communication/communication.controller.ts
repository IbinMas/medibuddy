import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { CommunicationService } from './communication.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { DeliveryStatus } from '@prisma/client';

@Controller('communication')
@UseGuards(JwtAuthGuard)
export class CommunicationController {
  constructor(private readonly commsService: CommunicationService) {}

  @Get('logs')
  async getLogs(
    @Request() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: DeliveryStatus,
    @Query('search') search?: string,
  ) {
    const pharmacyId = req.user.pharmacyId;
    return this.commsService.findAll(pharmacyId, { page, limit, status, search });
  }
}
