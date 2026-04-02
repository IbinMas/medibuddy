import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentService } from './payment.service';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.type';
import { TransactionStatus } from '@prisma/client';

@Controller('payments')
@UseGuards(JwtAuthGuard, TenantGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  initiate(@Req() req: AuthenticatedRequest, @Body() dto: CreatePaymentDto) {
    return this.paymentService.initiate(req.pharmacyId ?? req.user.pharmacyId, dto);
  }

  @Post(':reference/confirm')
  confirm(@Param('reference') reference: string, @Body('status') status: TransactionStatus) {
    return this.paymentService.confirm(reference, status);
  }

  @Get()
  list(@Req() req: AuthenticatedRequest) {
    return this.paymentService.listTransactions(req.pharmacyId ?? req.user.pharmacyId);
  }
}
