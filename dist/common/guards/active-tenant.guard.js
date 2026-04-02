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
exports.ActiveTenantGuard = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
let ActiveTenantGuard = class ActiveTenantGuard {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const pharmacyId = request.user?.pharmacyId;
        if (!pharmacyId) {
            throw new common_1.ForbiddenException('Tenant context is required');
        }
        const pharmacy = await this.prisma.pharmacy.findUnique({
            where: { id: pharmacyId },
            select: {
                id: true,
                isActive: true,
                plan: true,
                subscriptions: {
                    where: { status: client_1.SubscriptionStatus.ACTIVE },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: { status: true, expiresAt: true },
                },
            },
        });
        if (!pharmacy || !pharmacy.isActive) {
            throw new common_1.ForbiddenException('Pharmacy is inactive');
        }
        const subscription = pharmacy.subscriptions[0];
        if (!subscription || subscription.expiresAt.getTime() < Date.now()) {
            throw new common_1.ForbiddenException('Subscription is inactive');
        }
        request.pharmacyId = pharmacy.id;
        request.pharmacy = {
            id: pharmacy.id,
            isActive: pharmacy.isActive,
            plan: pharmacy.plan,
        };
        return true;
    }
};
exports.ActiveTenantGuard = ActiveTenantGuard;
exports.ActiveTenantGuard = ActiveTenantGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ActiveTenantGuard);
//# sourceMappingURL=active-tenant.guard.js.map