"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
const encryption_1 = require("../common/crypto/encryption");
let AnalyticsService = class AnalyticsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async summary(pharmacyId) {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const [patients, prescriptions, transactions, auditLogs, notificationDist, monthlyGrowth, adherenceDist, allPrescriptions, allLogs, allTransactions] = await Promise.all([
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
        const medMap = {};
        allPrescriptions.forEach(p => {
            try {
                const name = (0, encryption_1.decrypt)(p.medicationEncrypted);
                medMap[name] = (medMap[name] || 0) + 1;
            }
            catch (e) { /* skip invalid data */ }
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
        const revenueMap = {};
        allTransactions.forEach(t => {
            const dateKey = new Date(t.createdAt).toLocaleDateString('default', { month: 'short', day: 'numeric' });
            if (!revenueMap[dateKey])
                revenueMap[dateKey] = { revenue: 0, transactions: 0 };
            revenueMap[dateKey].revenue += t.amount;
            revenueMap[dateKey].transactions++;
        });
        const revenueTrends = Object.entries(revenueMap)
            .slice(-15) // Limit to last 15 days for visual clarity on dashboard
            .map(([date, data]) => ({ date, ...data }));
        // Process growth data into months
        const growthMap = {};
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
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map