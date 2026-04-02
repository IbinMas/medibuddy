import { Injectable, NotFoundException } from '@nestjs/common';
import { TransactionStatus, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { randomUUID } from 'crypto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async initiate(pharmacyId: string, dto: CreatePaymentDto) {
    const reference = randomUUID();

    const transaction = await this.prisma.transaction.create({
      data: {
        pharmacyId,
        amount: dto.amount,
        provider: dto.provider,
        reference,
        status: TransactionStatus.PENDING,
      },
    });

    await this.auditService.logAction({
      pharmacyId,
      action: 'CREATE',
      entity: 'Transaction',
      entityId: transaction.id,
      metadata: { amount: dto.amount, provider: dto.provider, status: transaction.status },
    });

    return {
      transaction,
      prompt: 'MoMo payment prompt should be triggered by the provider adapter.',
    };
  }

  async confirm(reference: string, status: TransactionStatus) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { reference },
    });
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const updated = await this.prisma.transaction.update({
      where: { reference },
      data: { status },
    });

    await this.auditService.logAction({
      pharmacyId: transaction.pharmacyId,
      action: 'UPDATE',
      entity: 'Transaction',
      entityId: updated.id,
      metadata: { status },
    });

    if (status === TransactionStatus.COMPLETED) {
      await this.prisma.subscription.updateMany({
        where: { pharmacyId: transaction.pharmacyId },
        data: {
          status: SubscriptionStatus.ACTIVE,
        },
      });
    }

    return updated;
  }

  listTransactions(pharmacyId: string) {
    return this.prisma.transaction.findMany({
      where: { pharmacyId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
