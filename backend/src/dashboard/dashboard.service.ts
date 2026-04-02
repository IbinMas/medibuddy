import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(pharmacyId: string) {
    const [patients, prescriptions, transactions, auditLogs, invites, pharmacy] =
      await Promise.all([
        this.prisma.patient.count({ where: { pharmacyId, deletedAt: null } }),
        this.prisma.prescription.count({ where: { pharmacyId } }),
        this.prisma.transaction.count({ where: { pharmacyId } }),
        this.prisma.auditLog.count({ where: { pharmacyId } }),
        this.prisma.invite.count({ where: { pharmacyId } }),
        this.prisma.pharmacy.findUnique({
          where: { id: pharmacyId },
          select: {
            id: true,
            name: true,
            phone: true,
            plan: true,
            isActive: true,
            subscriptions: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                id: true,
                status: true,
                expiresAt: true,
                plan: true,
              },
            },
          },
        }),
      ]);

    return {
      pharmacy,
      metrics: {
        patients,
        prescriptions,
        transactions,
        auditLogs,
        invites,
      },
    };
  }
}
