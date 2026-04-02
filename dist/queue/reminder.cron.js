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
var ReminderCronService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderCronService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../database/prisma.service");
const whatsapp_service_1 = require("../common/whatsapp/whatsapp.service");
const sms_service_1 = require("../common/sms/sms.service");
const encryption_1 = require("../common/crypto/encryption");
let ReminderCronService = ReminderCronService_1 = class ReminderCronService {
    prisma;
    whatsappService;
    smsService;
    logger = new common_1.Logger(ReminderCronService_1.name);
    constructor(prisma, whatsappService, smsService) {
        this.prisma = prisma;
        this.whatsappService = whatsappService;
        this.smsService = smsService;
    }
    async handleHourlyReminders() {
        // Determine current hour string, e.g., '08:00', '14:00', etc.
        const now = new Date();
        // Use local time matching node environment hour
        const currentHourString = `${now.getHours().toString().padStart(2, '0')}:00`;
        try {
            // Find all patients who have active prescriptions
            // We look for prescriptions where startDate <= now <= endDate
            const activePrescriptions = await this.prisma.prescription.findMany({
                where: {
                    startDate: { lte: now },
                    endDate: { gte: now },
                },
                include: {
                    patient: true,
                    pharmacy: true,
                },
            });
            // Group due prescriptions by patientId
            const groupedByPatient = {};
            for (const presc of activePrescriptions) {
                const prescription = presc;
                if (!prescription.patient || !prescription.pharmacy)
                    continue;
                if (prescription.patient.notificationMedium !== 'WHATSAPP' && prescription.patient.notificationMedium !== 'SMS')
                    continue;
                const freq = prescription.frequency.toLowerCase();
                let times = ['08:00'];
                if (freq.includes('2') || freq.includes('twice')) {
                    times = ['08:00', '20:00'];
                }
                else if (freq.includes('3') || freq.includes('three')) {
                    times = ['08:00', '14:00', '20:00'];
                }
                else if (freq.includes('4') || freq.includes('four')) {
                    times = ['06:00', '12:00', '18:00', '00:00'];
                }
                // Check if the current hour matches the schedule
                if (times.includes(currentHourString)) {
                    if (!groupedByPatient[prescription.patientId]) {
                        groupedByPatient[prescription.patientId] = [];
                    }
                    groupedByPatient[prescription.patientId].push({
                        ...prescription,
                        medication: (0, encryption_1.decrypt)(prescription.medicationEncrypted),
                    });
                }
            }
            const patientIds = Object.keys(groupedByPatient);
            if (patientIds.length === 0) {
                return;
            }
            this.logger.log(`Found ${patientIds.length} patients with reminders for ${currentHourString}. Sending consolidated messages...`);
            for (const patientId of patientIds) {
                const prescriptions = groupedByPatient[patientId];
                const patient = prescriptions[0].patient;
                const pharmacy = prescriptions[0].pharmacy; // Assuming same pharmacy for simplicity
                if (patient.notificationMedium === 'WHATSAPP') {
                    await this.whatsappService.sendGroupedReminderMessage(patient, pharmacy, prescriptions, currentHourString);
                }
                else if (patient.notificationMedium === 'SMS') {
                    await this.smsService.sendGroupedReminderMessage(patient, pharmacy, prescriptions, currentHourString);
                }
            }
        }
        catch (error) {
            this.logger.error('Failed to process grouped reminders', error);
        }
    }
};
exports.ReminderCronService = ReminderCronService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReminderCronService.prototype, "handleHourlyReminders", null);
exports.ReminderCronService = ReminderCronService = ReminderCronService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        whatsapp_service_1.WhatsappService,
        sms_service_1.SmsService])
], ReminderCronService);
//# sourceMappingURL=reminder.cron.js.map