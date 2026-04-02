"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var WhatsappService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappService = void 0;
const common_1 = require("@nestjs/common");
const encryption_1 = require("../crypto/encryption");
const axios_1 = __importDefault(require("axios"));
let WhatsappService = WhatsappService_1 = class WhatsappService {
    logger = new common_1.Logger(WhatsappService_1.name);
    accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    apiVersion = process.env.WHATSAPP_API_VERSION || 'v20.0';
    async sendPrescriptionMessage(patient, pharmacy, prescription) {
        const firstName = (0, encryption_1.decrypt)(patient.firstNameEncrypted).trim();
        const lastName = (0, encryption_1.decrypt)(patient.lastNameEncrypted).trim();
        const phone = +233245724489 || this.formatPhoneNumber((0, encryption_1.decrypt)(patient.phoneEncrypted));
        const medication = (0, encryption_1.decrypt)(prescription.medicationEncrypted);
        const message = [
            `*New Prescription from ${pharmacy.name}*`,
            '',
            `👨‍⚕️ *Patient:* ${firstName} ${lastName}`,
            `💊 *Medication:* ${medication}`,
            `🕒 *Dosage:* ${prescription.dosage}`,
            `🔄 *Frequency:* ${prescription.frequency}`,
            `📅 *Dates:* ${this.formatDate(prescription.startDate)} to ${this.formatDate(prescription.endDate)}`,
            '',
            `_Please follow the dosage instructions carefully._`,
            `_Contact us at ${pharmacy.phone} if you have any questions._`,
        ].join('\n');
        if (!this.accessToken || !this.phoneNumberId) {
            this.logger.warn('WhatsApp credentials not found. Simulation mode enabled.');
            this.logger.log(`[WhatsApp Simulation] To: ${phone}\nMessage:\n${message}`);
            return { success: false, mode: 'simulation', phone };
        }
        try {
            const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
            // Using a template ensures delivery even if the 24h window is closed.
            // Template Name: prescription_notification
            // Variables: 1: PharmacyName, 2: PatientName, 3: Medication, 4: Dosage, 5: Frequency
            const templatePayload = {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: phone,
                type: 'template',
                template: {
                    name: process.env.WHATSAPP_TEMPLATE_NAME || 'detailed_prescription',
                    language: { code: 'en' },
                    components: [
                        {
                            type: 'body',
                            parameters: [
                                { type: 'text', text: `${firstName} ${lastName}` },
                                { type: 'text', text: pharmacy.name },
                                { type: 'text', text: medication },
                                { type: 'text', text: prescription.dosage },
                                { type: 'text', text: prescription.frequency },
                                { type: 'text', text: prescription.mealTiming === 'BEFORE_MEAL' ? 'Before Meal' : (prescription.mealTiming === 'AFTER_MEAL' ? 'After Meal' : 'As Directed') },
                                { type: 'text', text: this.formatDate(prescription.startDate) },
                                { type: 'text', text: this.formatDate(prescription.endDate) }
                            ],
                        },
                    ],
                },
            };
            const response = await axios_1.default.post(url, templatePayload, {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                },
            });
            this.logger.log(`WhatsApp Template sent to ${phone}. Message ID: ${response.data.messages[0]?.id}`);
            return { success: true, messageId: response.data.messages[0]?.id };
        }
        catch (error) {
            this.logger.error(`Failed to send WhatsApp Template to ${phone}: ${error.response?.data?.error?.message || error.message}`);
            return { success: false, error: error.response?.data?.error || error.message };
        }
    }
    async sendGroupedPrescriptionMessage(patient, pharmacy, prescriptions) {
        const firstName = (0, encryption_1.decrypt)(patient.firstNameEncrypted).trim();
        const lastName = (0, encryption_1.decrypt)(patient.lastNameEncrypted).trim();
        const phone = this.formatPhoneNumber((0, encryption_1.decrypt)(patient.phoneEncrypted));
        const medList = prescriptions.map((p, index) => `${index + 1}. ${p.medication} (${p.dosage}, ${p.frequency})`).join(', ');
        const displayList = prescriptions.map((p, i) => `• *${p.medication}* (${p.dosage})`).join('\n');
        const message = [
            `*New Prescriptions from ${pharmacy.name}*`,
            '',
            `Hi ${firstName}, you have new medications:`,
            '',
            displayList,
            '',
            `_Please check the dashboard for dosage schedules._`
        ].join('\n');
        if (!this.accessToken || !this.phoneNumberId) {
            this.logger.warn('WhatsApp credentials not found. Simulation mode enabled.');
            this.logger.log(`[WhatsApp Grouped Simulation] To: ${phone}\nMessage:\n${message}`);
            return { success: false, mode: 'simulation', phone };
        }
        try {
            const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
            const templatePayload = {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: phone,
                type: 'template',
                template: {
                    name: process.env.WHATSAPP_GROUPED_PRESCRIPTION_TEMPLATE || 'grouped_prescription_notification',
                    language: { code: 'en' },
                    components: [
                        {
                            type: 'body',
                            parameters: [
                                { type: 'text', text: `${firstName} ${lastName}` },
                                { type: 'text', text: pharmacy.name },
                                { type: 'text', text: medList }
                            ],
                        },
                    ],
                },
            };
            const response = await axios_1.default.post(url, templatePayload, {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                },
            });
            this.logger.log(`WhatsApp Grouped Prescription sent to ${phone}. Message ID: ${response.data.messages[0]?.id}`);
            return { success: true, messageId: response.data.messages[0]?.id };
        }
        catch (error) {
            this.logger.error(`Failed to send WhatsApp Grouped Prescription to ${phone}: ${error.response?.data?.error?.message || error.message}`);
            return { success: false, error: error.response?.data?.error || error.message };
        }
    }
    async sendGroupedReminderMessage(patient, pharmacy, prescriptions, timeString) {
        const firstName = (0, encryption_1.decrypt)(patient.firstNameEncrypted).trim();
        const phone = this.formatPhoneNumber((0, encryption_1.decrypt)(patient.phoneEncrypted));
        const medList = prescriptions.map((p, index) => `${index + 1}. ${p.medication} (${p.dosage})`).join(', ');
        const displayList = prescriptions.map((p, i) => `${i + 1}. *${p.medication}* (${p.dosage})`).join('\n');
        const message = [
            `*Medication Reminder 🕒*`,
            '',
            `Hi ${firstName}, it is ${timeString}.`,
            `It's time to take your medications:`,
            '',
            displayList,
            '',
            `_From ${pharmacy.name}_`
        ].join('\n');
        if (!this.accessToken || !this.phoneNumberId) {
            this.logger.warn('WhatsApp credentials not found. Simulation mode enabled.');
            this.logger.log(`[WhatsApp Grouped Simulation] To: ${phone}\nMessage:\n${message}`);
            return { success: false, mode: 'simulation', phone };
        }
        try {
            const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
            const templatePayload = {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: phone,
                type: 'template',
                template: {
                    name: process.env.WHATSAPP_REMINDER_TEMPLATE_NAME || 'grouped_medication_reminder',
                    language: { code: 'en_GB' },
                    components: [
                        {
                            type: 'body',
                            parameters: [
                                { type: 'text', text: firstName },
                                { type: 'text', text: timeString },
                                { type: 'text', text: medList }
                            ],
                        },
                    ],
                },
            };
            const response = await axios_1.default.post(url, templatePayload, {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                },
            });
            this.logger.log(`WhatsApp Grouped Reminder sent to ${phone}. Message ID: ${response.data.messages[0]?.id}`);
            return { success: true, messageId: response.data.messages[0]?.id };
        }
        catch (error) {
            this.logger.error(`Failed to send WhatsApp Grouped Template to ${phone}: ${error.response?.data?.error?.message || error.message}`);
            return { success: false, error: error.response?.data?.error || error.message };
        }
    }
    formatPhoneNumber(phone) {
        // Meta requires numbers in international format without '+' or '00'
        // E.g. +233244123456 -> 233244123456
        return phone.replace(/\D/g, '');
    }
    formatDate(date) {
        return new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    }
};
exports.WhatsappService = WhatsappService;
exports.WhatsappService = WhatsappService = WhatsappService_1 = __decorate([
    (0, common_1.Injectable)()
], WhatsappService);
//# sourceMappingURL=whatsapp.service.js.map