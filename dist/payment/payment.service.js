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
exports.PaymentService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../database/prisma.service");
const crypto_1 = require("crypto");
const audit_service_1 = require("../audit/audit.service");
let PaymentService = class PaymentService {
    prisma;
    auditService;
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async initiate(pharmacyId, dto) {
        const reference = (0, crypto_1.randomUUID)();
        const transaction = await this.prisma.transaction.create({
            data: {
                pharmacyId,
                amount: dto.amount,
                provider: dto.provider,
                reference,
                status: client_1.TransactionStatus.PENDING,
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
    async confirm(reference, status) {
        const transaction = await this.prisma.transaction.findUnique({
            where: { reference },
        });
        if (!transaction) {
            throw new common_1.NotFoundException('Transaction not found');
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
        if (status === client_1.TransactionStatus.COMPLETED) {
            await this.prisma.subscription.updateMany({
                where: { pharmacyId: transaction.pharmacyId },
                data: {
                    status: client_1.SubscriptionStatus.ACTIVE,
                },
            });
        }
        return updated;
    }
    listTransactions(pharmacyId) {
        return this.prisma.transaction.findMany({
            where: { pharmacyId },
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.PaymentService = PaymentService;
exports.PaymentService = PaymentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], PaymentService);
//# sourceMappingURL=payment.service.js.map