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
exports.PrescriptionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
const encryption_1 = require("../common/crypto/encryption");
const audit_service_1 = require("../audit/audit.service");
const reminder_queue_service_1 = require("../queue/reminder-queue.service");
let PrescriptionService = class PrescriptionService {
    prisma;
    auditService;
    reminderQueue;
    constructor(prisma, auditService, reminderQueue) {
        this.prisma = prisma;
        this.auditService = auditService;
        this.reminderQueue = reminderQueue;
    }
    async create(pharmacyId, dto) {
        const patient = await this.prisma.patient.findFirst({
            where: { id: dto.patientId, pharmacyId, deletedAt: null },
        });
        if (!patient) {
            throw new common_1.NotFoundException('Patient not found');
        }
        const prescription = await this.prisma.prescription.create({
            data: {
                pharmacyId,
                patientId: dto.patientId,
                medicationEncrypted: (0, encryption_1.encrypt)(dto.medication),
                dosage: dto.dosage,
                frequency: dto.frequency,
                startDate: new Date(dto.startDate),
                endDate: new Date(dto.endDate),
            },
            include: { adherence: true },
        });
        await this.reminderQueue.scheduleReminder({
            pharmacyId,
            patientId: dto.patientId,
            prescriptionId: prescription.id,
            scheduledAt: dto.startDate,
            medium: patient.notificationMedium,
        });
        await this.auditService.logAction({
            pharmacyId,
            action: 'CREATE',
            entity: 'Prescription',
            entityId: prescription.id,
            metadata: { patientId: dto.patientId, dosage: dto.dosage, frequency: dto.frequency },
        });
        return prescription;
    }
    history(patientId, pharmacyId) {
        return this.prisma.prescription.findMany({
            where: { patientId, pharmacyId },
            include: { adherence: true },
            orderBy: { createdAt: 'desc' },
        }).then((prescriptions) => prescriptions.map((prescription) => ({
            ...prescription,
            medication: (0, encryption_1.decrypt)(prescription.medicationEncrypted),
        })));
    }
    async findAll(pharmacyId, page = 1, limit = 20, search) {
        const prescriptions = await this.prisma.prescription.findMany({
            where: { pharmacyId },
            include: { patient: true },
            orderBy: { createdAt: 'desc' },
        });
        let decrypted = prescriptions.map((p) => ({
            ...p,
            medication: (0, encryption_1.decrypt)(p.medicationEncrypted),
            patient: {
                ...p.patient,
                firstName: (0, encryption_1.decrypt)(p.patient.firstNameEncrypted),
                lastName: (0, encryption_1.decrypt)(p.patient.lastNameEncrypted),
            },
        }));
        if (search) {
            const s = search.toLowerCase();
            decrypted = decrypted.filter((p) => p.medication.toLowerCase().includes(s) ||
                p.patient.firstName.toLowerCase().includes(s) ||
                p.patient.lastName.toLowerCase().includes(s));
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
};
exports.PrescriptionService = PrescriptionService;
exports.PrescriptionService = PrescriptionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        reminder_queue_service_1.ReminderQueueService])
], PrescriptionService);
//# sourceMappingURL=prescription.service.js.map