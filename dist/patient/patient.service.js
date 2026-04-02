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
exports.PatientService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
const encryption_1 = require("../common/crypto/encryption");
const audit_service_1 = require("../audit/audit.service");
let PatientService = class PatientService {
    prisma;
    auditService;
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async create(pharmacyId, userId, dto) {
        const patient = await this.prisma.patient.create({
            data: {
                pharmacyId,
                firstNameEncrypted: (0, encryption_1.encrypt)(dto.firstName),
                lastNameEncrypted: (0, encryption_1.encrypt)(dto.lastName),
                phoneEncrypted: (0, encryption_1.encrypt)(dto.phone),
                allergiesEncrypted: dto.allergies ? (0, encryption_1.encrypt)(dto.allergies) : null,
                notesEncrypted: dto.notes ? (0, encryption_1.encrypt)(dto.notes) : null,
                notificationMedium: dto.notificationMedium ?? 'NONE',
            },
        });
        await this.auditService.logAction({
            pharmacyId,
            userId,
            action: 'CREATE',
            entity: 'Patient',
            entityId: patient.id,
            metadata: { firstName: dto.firstName, lastName: dto.lastName },
        });
        return patient;
    }
    async update(patientId, pharmacyId, userId, dto) {
        const patient = await this.prisma.patient.findFirst({
            where: { id: patientId, pharmacyId, deletedAt: null },
        });
        if (!patient) {
            throw new common_1.NotFoundException('Patient not found');
        }
        const updateData = {};
        if (dto.firstName)
            updateData.firstNameEncrypted = (0, encryption_1.encrypt)(dto.firstName);
        if (dto.lastName)
            updateData.lastNameEncrypted = (0, encryption_1.encrypt)(dto.lastName);
        if (dto.phone)
            updateData.phoneEncrypted = (0, encryption_1.encrypt)(dto.phone);
        if (dto.allergies !== undefined) {
            updateData.allergiesEncrypted = dto.allergies ? (0, encryption_1.encrypt)(dto.allergies) : null;
        }
        if (dto.notes !== undefined) {
            updateData.notesEncrypted = dto.notes ? (0, encryption_1.encrypt)(dto.notes) : null;
        }
        if (dto.notificationMedium)
            updateData.notificationMedium = dto.notificationMedium;
        const updated = await this.prisma.patient.update({
            where: { id: patientId },
            data: updateData,
        });
        await this.auditService.logAction({
            pharmacyId,
            userId,
            action: 'UPDATE',
            entity: 'Patient',
            entityId: updated.id,
            metadata: { fields: Object.keys(dto) },
        });
        return updated;
    }
    async list(pharmacyId, page = 1, limit = 20, search) {
        const patients = await this.prisma.patient.findMany({
            where: { pharmacyId, deletedAt: null },
            orderBy: { createdAt: 'desc' },
        });
        let decrypted = patients.map((patient) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { firstNameEncrypted, lastNameEncrypted, ...rest } = patient;
            return {
                ...rest,
                firstName: (0, encryption_1.decrypt)(patient.firstNameEncrypted),
                lastName: (0, encryption_1.decrypt)(patient.lastNameEncrypted),
                phone: (0, encryption_1.decrypt)(patient.phoneEncrypted),
                allergies: patient.allergiesEncrypted ? (0, encryption_1.decrypt)(patient.allergiesEncrypted) : null,
                notes: patient.notesEncrypted ? (0, encryption_1.decrypt)(patient.notesEncrypted) : null,
                notificationMedium: patient.notificationMedium,
            };
        });
        if (search) {
            const s = search.toLowerCase();
            decrypted = decrypted.filter((p) => p.firstName.toLowerCase().includes(s) ||
                p.lastName.toLowerCase().includes(s) ||
                p.phone.includes(s));
        }
        const total = decrypted.length;
        const startIndex = (page - 1) * limit;
        const paginatedData = decrypted.slice(startIndex, startIndex + limit);
        return {
            data: paginatedData,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async getDecryptedHistory(patientId, pharmacyId) {
        const patient = await this.prisma.patient.findFirst({
            where: { id: patientId, pharmacyId, deletedAt: null },
            include: {
                prescriptions: {
                    include: { adherence: true },
                },
            },
        });
        if (!patient) {
            return null;
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { firstNameEncrypted, lastNameEncrypted, ...rest } = patient;
        return {
            ...rest,
            firstName: (0, encryption_1.decrypt)(patient.firstNameEncrypted),
            lastName: (0, encryption_1.decrypt)(patient.lastNameEncrypted),
            phone: (0, encryption_1.decrypt)(patient.phoneEncrypted),
            allergies: patient.allergiesEncrypted ? (0, encryption_1.decrypt)(patient.allergiesEncrypted) : null,
            notes: patient.notesEncrypted ? (0, encryption_1.decrypt)(patient.notesEncrypted) : null,
            notificationMedium: patient.notificationMedium,
        };
    }
    async softDelete(patientId, pharmacyId, userId) {
        const patient = await this.prisma.patient.findFirst({
            where: { id: patientId, pharmacyId, deletedAt: null },
        });
        if (!patient) {
            return null;
        }
        const deleted = await this.prisma.patient.update({
            where: { id: patientId },
            data: { deletedAt: new Date() },
        });
        await this.auditService.logAction({
            pharmacyId,
            userId,
            action: 'DELETE',
            entity: 'Patient',
            entityId: deleted.id,
            metadata: { deletedAt: deleted.deletedAt },
        });
        return deleted;
    }
};
exports.PatientService = PatientService;
exports.PatientService = PatientService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], PatientService);
//# sourceMappingURL=patient.service.js.map