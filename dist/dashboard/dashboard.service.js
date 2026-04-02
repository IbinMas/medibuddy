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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
let DashboardService = class DashboardService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async summary(pharmacyId) {
        const [patients, prescriptions, transactions, auditLogs, invites, pharmacy] = await Promise.all([
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
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map