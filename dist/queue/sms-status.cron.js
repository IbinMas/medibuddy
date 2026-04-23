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
var SmsStatusCronService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsStatusCronService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../database/prisma.service");
const sms_service_1 = require("../common/sms/sms.service");
const communication_service_1 = require("../common/communication/communication.service");
const client_1 = require("@prisma/client");
let SmsStatusCronService = SmsStatusCronService_1 = class SmsStatusCronService {
    prisma;
    smsService;
    communicationService;
    logger = new common_1.Logger(SmsStatusCronService_1.name);
    constructor(prisma, smsService, communicationService) {
        this.prisma = prisma;
        this.smsService = smsService;
        this.communicationService = communicationService;
    }
    async handleSmsStatusUpdates() {
        this.logger.log('Checking SMS statuses from Arkesel...');
        try {
            // Find prescriptions that are pending and have a messageId
            const pendingPrescriptions = await this.prisma.prescription.findMany({
                where: {
                    deliveryStatus: client_1.DeliveryStatus.PENDING,
                    messageId: { not: null },
                },
                // To avoid redundant work, we group by messageId
                distinct: ['messageId'],
            });
            if (pendingPrescriptions.length === 0) {
                return;
            }
            this.logger.log(`Found ${pendingPrescriptions.length} distinct messageId(s) to check.`);
            for (const presc of pendingPrescriptions) {
                if (!presc.messageId)
                    continue;
                const arkaselStatus = await this.smsService.getSmsStatus(presc.messageId);
                if (!arkaselStatus) {
                    continue;
                }
                this.logger.log(`Arkasel status for ${presc.messageId}: ${arkaselStatus}`);
                let newStatus = null;
                // Treat SUBMITTED as DELIVERED as per user requirement
                if (arkaselStatus === 'DELIVERED' || arkaselStatus === 'SUBMITTED' || arkaselStatus === 'SUCCESS') {
                    newStatus = client_1.DeliveryStatus.DELIVERED;
                }
                else if (arkaselStatus === 'FAILED' || arkaselStatus === 'REJECTED' || arkaselStatus === 'EXPIRED') {
                    newStatus = client_1.DeliveryStatus.FAILED;
                }
                if (newStatus) {
                    await this.prisma.prescription.updateMany({
                        where: { messageId: presc.messageId },
                        data: { deliveryStatus: newStatus },
                    });
                    await this.communicationService.updateStatus(presc.messageId, newStatus);
                    this.logger.log(`Updated status for messageId ${presc.messageId} to ${newStatus}`);
                }
            }
        }
        catch (error) {
            this.logger.error('Failed to update SMS statuses', error);
        }
    }
};
exports.SmsStatusCronService = SmsStatusCronService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_5_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SmsStatusCronService.prototype, "handleSmsStatusUpdates", null);
exports.SmsStatusCronService = SmsStatusCronService = SmsStatusCronService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        sms_service_1.SmsService,
        communication_service_1.CommunicationService])
], SmsStatusCronService);
//# sourceMappingURL=sms-status.cron.js.map