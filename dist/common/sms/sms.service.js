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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var SmsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsService = void 0;
const common_1 = require("@nestjs/common");
const encryption_1 = require("../crypto/encryption");
const communication_service_1 = require("../communication/communication.service");
const client_1 = require("@prisma/client");
const axios_1 = __importDefault(require("axios"));
let SmsService = SmsService_1 = class SmsService {
    communicationService;
    logger = new common_1.Logger(SmsService_1.name);
    smsApiKey = process.env.SMS_API_KEY;
    smsSenderId = process.env.SMS_SENDER_ID || 'MediBuddy';
    // Use the exact URL provided by the user, but Arkesel is the correct spelling for the official service.
    // We'll use the user's provided URL format.
    smsApiUrl = 'https://sms.arkesel.com/api/v2/sms/send';
    constructor(communicationService) {
        this.communicationService = communicationService;
    }
    async sendPrescriptionMessage(patient, pharmacy, prescription) {
        const firstName = (0, encryption_1.decrypt)(patient.firstNameEncrypted).trim();
        const phone = (0, encryption_1.decrypt)(patient.phoneEncrypted).trim();
        const medication = (0, encryption_1.decrypt)(prescription.medicationEncrypted);
        const timingText = prescription.mealTiming === 'BEFORE_MEAL' ? 'Before Meal' : (prescription.mealTiming === 'AFTER_MEAL' ? 'After Meal' : '');
        const timingStr = timingText ? ` (${timingText})` : '';
        const message = `Hi ${firstName}, ${pharmacy.name} prescribed: ${medication}, ${prescription.dosage}, ${prescription.frequency}${timingStr}. Use from ${this.formatDate(prescription.startDate)} to ${this.formatDate(prescription.endDate)}.`;
        if (!this.smsApiKey) {
            this.logger.warn('SMS API Key not found in environment. Simulation mode enabled.');
            this.logger.log(`[SMS Simulation] To: ${phone}\nMessage: ${message}`);
            return { success: false, mode: 'simulation', phone };
        }
        try {
            const response = await axios_1.default.post(this.smsApiUrl, {
                sender: this.smsSenderId,
                message: message,
                recipients: [phone],
            }, {
                headers: {
                    'api-key': this.smsApiKey,
                    'Authorization': `Bearer ${this.smsApiKey}`,
                },
            });
            this.logger.log(`SMS sent to ${phone}. Response: ${JSON.stringify(response.data)}`);
            const resData = response.data.data;
            const messageId = (Array.isArray(resData) ? resData[0]?.id : resData?.id) || response.data.id || response.data.main_id;
            await this.communicationService.logMessage({
                pharmacyId: pharmacy.id,
                patientId: patient.id,
                prescriptionId: prescription.id,
                medium: client_1.NotificationMedium.SMS,
                providerId: messageId ? String(messageId) : undefined,
                status: client_1.DeliveryStatus.PENDING,
                content: message,
            });
            return { success: true, data: response.data, messageId };
        }
        catch (error) {
            this.logger.error(`Failed to send SMS to ${phone}: ${error.message}`);
            await this.communicationService.logMessage({
                pharmacyId: pharmacy.id,
                patientId: patient.id,
                prescriptionId: prescription.id,
                medium: client_1.NotificationMedium.SMS,
                status: client_1.DeliveryStatus.FAILED,
                content: message,
            });
            return { success: false, error: error.message };
        }
    }
    async sendGroupedPrescriptionMessage(patient, pharmacy, prescriptions) {
        const firstName = (0, encryption_1.decrypt)(patient.firstNameEncrypted).trim();
        const phone = (0, encryption_1.decrypt)(patient.phoneEncrypted).trim();
        const medList = prescriptions.map((p, i) => `${i + 1}. ${p.medication} (${p.dosage}, ${p.frequency})`).join('; ');
        const message = `Hi ${firstName}, ${pharmacy.name} prescribed: ${medList}. Check your schedule for details.`;
        if (!this.smsApiKey) {
            this.logger.warn('SMS API Key not found in environment. Simulation mode enabled.');
            this.logger.log(`[Grouped SMS Simulation] To: ${phone}\nMessage: ${message}`);
            return { success: false, mode: 'simulation', phone };
        }
        try {
            const response = await axios_1.default.post(this.smsApiUrl, {
                sender: this.smsSenderId,
                message: message,
                recipients: [phone],
            }, {
                headers: {
                    'api-key': this.smsApiKey,
                    'Authorization': `Bearer ${this.smsApiKey}`,
                },
            });
            this.logger.log(`Grouped SMS sent to ${phone}. Response: ${JSON.stringify(response.data)}`);
            const resData = response.data.data;
            const messageId = (Array.isArray(resData) ? resData[0]?.id : resData?.id) || response.data.id || response.data.main_id;
            await this.communicationService.logMessage({
                pharmacyId: pharmacy.id,
                patientId: patient.id,
                medium: client_1.NotificationMedium.SMS,
                providerId: messageId ? String(messageId) : undefined,
                status: client_1.DeliveryStatus.PENDING,
                content: message,
            });
            return { success: true, data: response.data, messageId };
        }
        catch (error) {
            this.logger.error(`Failed to send Grouped SMS to ${phone}: ${error.message}`);
            await this.communicationService.logMessage({
                pharmacyId: pharmacy.id,
                patientId: patient.id,
                medium: client_1.NotificationMedium.SMS,
                status: client_1.DeliveryStatus.FAILED,
                content: message,
            });
            return { success: false, error: error.message };
        }
    }
    async sendGroupedReminderMessage(patient, pharmacy, prescriptions, timeString) {
        const firstName = (0, encryption_1.decrypt)(patient.firstNameEncrypted).trim();
        const phone = (0, encryption_1.decrypt)(patient.phoneEncrypted).trim();
        const medList = prescriptions.map((p, i) => `${i + 1}. ${p.medication} (${p.dosage})`).join(', ');
        const message = `Reminder (${timeString}): Hi ${firstName}, it's time to take your medications: ${medList}. From ${pharmacy.name}.`;
        if (!this.smsApiKey) {
            this.logger.warn('SMS API Key not found in environment. Simulation mode enabled.');
            this.logger.log(`[Grouped SMS Simulation] To: ${phone}\nMessage: ${message}`);
            return { success: false, mode: 'simulation', phone };
        }
        try {
            const response = await axios_1.default.post(this.smsApiUrl, {
                sender: this.smsSenderId,
                message: message,
                recipients: [phone],
            }, {
                headers: {
                    'api-key': this.smsApiKey,
                    'Authorization': `Bearer ${this.smsApiKey}`,
                },
            });
            this.logger.log(`SMS Grouped Reminder sent to ${phone}. Response: ${JSON.stringify(response.data)}`);
            const resData = response.data.data;
            const messageId = (Array.isArray(resData) ? resData[0]?.id : resData?.id) || response.data.id || response.data.main_id;
            await this.communicationService.logMessage({
                pharmacyId: pharmacy.id,
                patientId: patient.id,
                medium: client_1.NotificationMedium.SMS,
                providerId: messageId ? String(messageId) : undefined,
                status: client_1.DeliveryStatus.PENDING,
                content: message,
            });
            return { success: true, data: response.data, messageId };
        }
        catch (error) {
            this.logger.error(`Failed to send SMS Grouped Reminder: ${error.message}`);
            await this.communicationService.logMessage({
                pharmacyId: pharmacy.id,
                patientId: patient.id,
                medium: client_1.NotificationMedium.SMS,
                status: client_1.DeliveryStatus.FAILED,
                content: message,
            });
            return { success: false, error: error.message };
        }
    }
    async getSmsStatus(messageId) {
        if (!this.smsApiKey || !messageId) {
            return null;
        }
        try {
            const url = `https://sms.arkesel.com/api/v2/sms/${messageId}`;
            const response = await axios_1.default.get(url, {
                headers: {
                    'api-key': this.smsApiKey,
                },
            });
            const data = response.data;
            this.logger.log(`Status for ${messageId}: ${JSON.stringify(data)}`);
            // Extracts the status from the nested data object: response.data.data.status
            const status = data.data?.status || data.status;
            return status ? String(status).trim().toUpperCase() : null;
        }
        catch (error) {
            this.logger.error(`Failed to check SMS status for ${messageId}: ${error.message}`);
            return null;
        }
    }
    formatDate(date) {
        return new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    }
};
exports.SmsService = SmsService;
exports.SmsService = SmsService = SmsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [communication_service_1.CommunicationService])
], SmsService);
//# sourceMappingURL=sms.service.js.map