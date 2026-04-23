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
var ReminderProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderProcessor = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("bullmq");
const prisma_service_1 = require("../database/prisma.service");
const whatsapp_service_1 = require("../common/whatsapp/whatsapp.service");
const sms_service_1 = require("../common/sms/sms.service");
let ReminderProcessor = ReminderProcessor_1 = class ReminderProcessor {
    prisma;
    whatsappService;
    smsService;
    logger = new common_1.Logger(ReminderProcessor_1.name);
    constructor(prisma, whatsappService, smsService) {
        this.prisma = prisma;
        this.whatsappService = whatsappService;
        this.smsService = smsService;
    }
    async onModuleInit() {
        const host = process.env.REDIS_HOST || 'localhost';
        const port = parseInt(process.env.REDIS_PORT || '6379');
        const canConnect = await this.checkRedis(host, port);
        if (!canConnect) {
            this.logger.warn('Worker not started — Redis unavailable. Reminders will run in simulation mode.');
            return;
        }
        const worker = new bullmq_1.Worker('reminder-queue', async (job) => {
            if (job.name === 'send-reminder') {
                await this.processReminder(job.data);
            }
        }, { connection: { host, port } });
        worker.on('completed', (job) => {
            this.logger.log(`✅ Reminder Job ${job.id} completed.`);
        });
        worker.on('failed', (job, err) => {
            this.logger.error(`❌ Reminder Job ${job?.id} failed: ${err.message}`);
        });
        this.logger.log('✅ Reminder Worker started and listening for jobs.');
    }
    async processReminder(data) {
        this.logger.log(`Processing reminder for Prescription: ${data.prescriptionId}`);
        const [pharmacy, patient, prescription] = await Promise.all([
            this.prisma.pharmacy.findUnique({ where: { id: data.pharmacyId } }),
            this.prisma.patient.findUnique({ where: { id: data.patientId } }),
            this.prisma.prescription.findUnique({ where: { id: data.prescriptionId } }),
        ]);
        if (!pharmacy || !patient || !prescription) {
            throw new Error('Missing record during background processing — job will be retried.');
        }
        if (data.medium === 'WHATSAPP') {
            await this.whatsappService.sendPrescriptionMessage(patient, pharmacy, prescription);
        }
        else if (data.medium === 'SMS') {
            const smsResponse = await this.smsService.sendPrescriptionMessage(patient, pharmacy, prescription);
            if (smsResponse.success && smsResponse.messageId) {
                await this.prisma.prescription.update({
                    where: { id: prescription.id },
                    data: { messageId: String(smsResponse.messageId) }
                });
            }
        }
        else {
            this.logger.warn(`Medium [${data.medium}] not yet implemented in worker.`);
        }
    }
    /** Lightweight TCP check — does NOT create persistent connections */
    checkRedis(host, port) {
        return new Promise((resolve) => {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const net = require('net');
            const socket = new net.Socket();
            socket.setTimeout(1000);
            socket.on('connect', () => { socket.destroy(); resolve(true); });
            socket.on('timeout', () => { socket.destroy(); resolve(false); });
            socket.on('error', () => { socket.destroy(); resolve(false); });
            socket.connect(port, host);
        });
    }
};
exports.ReminderProcessor = ReminderProcessor;
exports.ReminderProcessor = ReminderProcessor = ReminderProcessor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        whatsapp_service_1.WhatsappService,
        sms_service_1.SmsService])
], ReminderProcessor);
//# sourceMappingURL=reminder-processor.js.map