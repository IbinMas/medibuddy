import { PaymentService } from './payment.service';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { TransactionStatus, SubscriptionStatus } from '@prisma/client';

describe('PaymentService tenant scoping', () => {
  const prisma = {
    transaction: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    subscription: {
      updateMany: jest.fn(),
    },
  } as unknown as PrismaService;

  const auditService = {
    logAction: jest.fn(),
  } as unknown as AuditService;

  const service = new PaymentService(prisma, auditService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects confirmation for a transaction outside the tenant', async () => {
    (prisma.transaction.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      service.confirm('pharmacy-1', 'ref-1', TransactionStatus.COMPLETED),
    ).rejects.toThrow('Transaction not found for this tenant');

    expect(prisma.transaction.findFirst).toHaveBeenCalledWith({
      where: { reference: 'ref-1', pharmacyId: 'pharmacy-1' },
    });
  });

  it('confirms a tenant-owned transaction and activates the subscription', async () => {
    (prisma.transaction.findFirst as jest.Mock).mockResolvedValue({
      id: 'tx-1',
      pharmacyId: 'pharmacy-1',
      reference: 'ref-1',
      status: TransactionStatus.PENDING,
    });
    (prisma.transaction.update as jest.Mock).mockResolvedValue({
      id: 'tx-1',
      pharmacyId: 'pharmacy-1',
      reference: 'ref-1',
      status: TransactionStatus.COMPLETED,
    });

    await service.confirm('pharmacy-1', 'ref-1', TransactionStatus.COMPLETED);

    expect(prisma.transaction.update).toHaveBeenCalledWith({
      where: { reference: 'ref-1' },
      data: { status: TransactionStatus.COMPLETED },
    });
    expect(prisma.subscription.updateMany).toHaveBeenCalledWith({
      where: { pharmacyId: 'pharmacy-1' },
      data: { status: SubscriptionStatus.ACTIVE },
    });
  });
});
