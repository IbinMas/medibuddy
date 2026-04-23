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
var CommunicationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const encryption_1 = require("../crypto/encryption");
let CommunicationService = CommunicationService_1 = class CommunicationService {
    prisma;
    logger = new common_1.Logger(CommunicationService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async logMessage(data) {
        try {
            return await this.prisma.communicationLog.create({
                data: {
                    pharmacyId: data.pharmacyId,
                    patientId: data.patientId,
                    prescriptionId: data.prescriptionId,
                    medium: data.medium,
                    providerId: data.providerId,
                    status: data.status,
                    content: data.content,
                },
            });
        }
        catch (error) {
            this.logger.error(`Failed to log message: ${error.message}`);
            // Don't throw — logging shouldn't break the main flow
        }
    }
    async updateStatus(providerId, status) {
        try {
            return await this.prisma.communicationLog.update({
                where: { providerId },
                data: { status },
            });
        }
        catch (error) {
            this.logger.warn(`Could not update message status for ${providerId}: ${error.message}`);
        }
    }
    async findAll(pharmacyId, query) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 20;
        const where = { pharmacyId };
        if (query.status) {
            where.status = query.status;
        }
        const [logs, total] = await Promise.all([
            this.prisma.communicationLog.findMany({
                where,
                include: {
                    patient: {
                        select: {
                            firstNameEncrypted: true,
                            lastNameEncrypted: true,
                            phoneEncrypted: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.communicationLog.count({ where }),
        ]);
        const decryptedLogs = logs.map((log) => ({
            ...log,
            patient: {
                ...log.patient,
                firstName: (0, encryption_1.decrypt)(log.patient.firstNameEncrypted),
                lastName: (0, encryption_1.decrypt)(log.patient.lastNameEncrypted),
                phone: (0, encryption_1.decrypt)(log.patient.phoneEncrypted),
            }
        }));
        const search = query.search?.trim().toLowerCase();
        const filteredLogs = search
            ? decryptedLogs.filter((log) => {
                const content = String(log.content ?? '').toLowerCase();
                const firstName = String(log.patient?.firstName ?? '').toLowerCase();
                const lastName = String(log.patient?.lastName ?? '').toLowerCase();
                const phone = String(log.patient?.phone ?? '').toLowerCase();
                return (content.includes(search) ||
                    firstName.includes(search) ||
                    lastName.includes(search) ||
                    phone.includes(search));
            })
            : decryptedLogs;
        const filteredTotal = search ? filteredLogs.length : total;
        const startIndex = (page - 1) * limit;
        const paginatedData = filteredLogs.slice(startIndex, startIndex + limit);
        return {
            data: paginatedData,
            total: filteredTotal,
            page,
            limit,
            totalPages: Math.ceil(filteredTotal / limit),
        };
    }
};
exports.CommunicationService = CommunicationService;
exports.CommunicationService = CommunicationService = CommunicationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CommunicationService);
//# sourceMappingURL=communication.service.js.map