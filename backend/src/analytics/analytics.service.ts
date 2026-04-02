import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { decrypt } from '../common/crypto/encryption';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(pharmacyId: string) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [
      patients, prescriptions, transactions, auditLogs, 
      notificationDist, monthlyGrowth, adherenceDist, 
      allPrescriptions, allLogs, allTransactions
    ] = await Promise.all([
      this.prisma.patient.count({ where: { pharmacyId, deletedAt: null } }),
      this.prisma.prescription.count({ where: { pharmacyId } }),
      this.prisma.transaction.count({ where: { pharmacyId } }),
      this.prisma.auditLog.count({ where: { pharmacyId } }),
      
      // Notification preference distribution
      this.prisma.patient.groupBy({
        by: ['notificationMedium'],
        where: { pharmacyId, deletedAt: null },
        _count: true,
      }),

      // Simple patient growth (last 6 months)
      this.prisma.patient.findMany({
        where: {
          pharmacyId,
          deletedAt: null,
          createdAt: { gte: sixMonthsAgo },
        },
        select: { createdAt: true },
      }),

      // Adherence Data
      this.prisma.adherence.groupBy({
        by: ['taken'],
        where: { prescription: { pharmacyId } },
        _count: true,
      }),

      // Top Medications (All for decryption)
      this.prisma.prescription.findMany({
        where: { pharmacyId },
        select: { medicationEncrypted: true },
      }),

      // Activity Peaks (Audit Logs)
      this.prisma.auditLog.findMany({
        where: { pharmacyId },
        select: { createdAt: true },
      }),

      // Revenue vs Transactions (last 30 days)
      this.prisma.transaction.findMany({
        where: { pharmacyId, status: 'COMPLETED' },
        select: { amount: true, createdAt: true },
      }),
    ]);

    // Process Adherence
    const adherence = adherenceDist.map(item => ({
      status: item.taken ? 'Taken' : 'Missed',
      count: item._count
    }));

    // Process Top Medications
    const medMap: Record<string, number> = {};
    allPrescriptions.forEach(p => {
      try {
        const name = decrypt(p.medicationEncrypted);
        medMap[name] = (medMap[name] || 0) + 1;
      } catch (e) { /* skip invalid data */ }
    });
    const topMeds = Object.entries(medMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Process Activity Peaks (Hourly)
    const hourlyActivity = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
    allLogs.forEach(log => {
      const hour = new Date(log.createdAt).getHours();
      hourlyActivity[hour].count++;
    });

    // Process Revenue Trends (Daily, 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const revenueMap: Record<string, { revenue: number, transactions: number }> = {};
    
    allTransactions.forEach(t => {
      const dateKey = new Date(t.createdAt).toLocaleDateString('default', { month: 'short', day: 'numeric' });
      if (!revenueMap[dateKey]) revenueMap[dateKey] = { revenue: 0, transactions: 0 };
      revenueMap[dateKey].revenue += t.amount;
      revenueMap[dateKey].transactions++;
    });

    const revenueTrends = Object.entries(revenueMap)
      .slice(-15) // Limit to last 15 days for visual clarity on dashboard
      .map(([date, data]) => ({ date, ...data }));



    // Process growth data into months
    const growthMap: Record<string, number> = {};
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthLabel = d.toLocaleString('default', { month: 'short' });
      growthMap[monthLabel] = 0;
    }

    monthlyGrowth.forEach((p) => {
      const monthLabel = new Date(p.createdAt).toLocaleString('default', { month: 'short' });
      if (growthMap[monthLabel] !== undefined) {
        growthMap[monthLabel]++;
      }
    });

    const trends = Object.entries(growthMap)
      .map(([month, count]) => ({ month, count }))
      .reverse();

    return {
      summary: {
        patients,
        prescriptions,
        transactions,
        auditLogs,
      },
      notificationDistribution: notificationDist.map((item) => ({
        medium: item.notificationMedium,
        count: item._count,
      })),
      patientTrends: trends,
      adherence,
      topMeds,
      hourlyActivity,
      revenueTrends
    };
  }
}
