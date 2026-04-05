import { Injectable, Logger } from '@nestjs/common';
import { decrypt } from '../crypto/encryption';
import { CommunicationService } from '../communication/communication.service';
import { NotificationMedium, DeliveryStatus } from '@prisma/client';
import axios from 'axios';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  private readonly accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  private readonly phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  private readonly apiVersion = process.env.WHATSAPP_API_VERSION || 'v20.0';

  constructor(private readonly communicationService: CommunicationService) {}

  async sendPrescriptionMessage(patient: any, pharmacy: any, prescription: any) {
    const firstName = decrypt(patient.firstNameEncrypted).trim();
    const lastName = decrypt(patient.lastNameEncrypted).trim();
    const phone = +233245724489|| this.formatPhoneNumber(decrypt(patient.phoneEncrypted));
    const medication = decrypt(prescription.medicationEncrypted);

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

      const response = await axios.post(url, templatePayload, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const messageId = response.data.messages[0]?.id;
      this.logger.log(`WhatsApp Template sent to ${phone}. Message ID: ${messageId}`);

      await this.communicationService.logMessage({
        pharmacyId: pharmacy.id,
        patientId: patient.id,
        prescriptionId: prescription.id,
        medium: NotificationMedium.WHATSAPP,
        providerId: messageId ? String(messageId) : undefined,
        status: DeliveryStatus.PENDING,
        content: message,
      });

      return { success: true, messageId };
    } catch (error: any) {
      const errorMsg = error.response?.data?.error?.message || error.message;
      this.logger.error(
        `Failed to send WhatsApp Template to ${phone}: ${errorMsg}`,
      );

      await this.communicationService.logMessage({
        pharmacyId: pharmacy.id,
        patientId: patient.id,
        prescriptionId: prescription.id,
        medium: NotificationMedium.WHATSAPP,
        status: DeliveryStatus.FAILED,
        content: message,
      });

      return { success: false, error: error.response?.data?.error || error.message };
    }
  }

  async sendGroupedPrescriptionMessage(patient: any, pharmacy: any, prescriptions: any[]) {
    const firstName = decrypt(patient.firstNameEncrypted).trim();
    const lastName = decrypt(patient.lastNameEncrypted).trim();
    const phone = this.formatPhoneNumber(decrypt(patient.phoneEncrypted));

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

      const response = await axios.post(url, templatePayload, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const messageId = response.data.messages[0]?.id;
      this.logger.log(`WhatsApp Grouped Prescription sent to ${phone}. Message ID: ${messageId}`);

      await this.communicationService.logMessage({
        pharmacyId: pharmacy.id,
        patientId: patient.id,
        medium: NotificationMedium.WHATSAPP,
        providerId: messageId ? String(messageId) : undefined,
        status: DeliveryStatus.PENDING,
        content: message,
      });

      return { success: true, messageId };
    } catch (error: any) {
      const errorMsg = error.response?.data?.error?.message || error.message;
      this.logger.error(`Failed to send WhatsApp Grouped Prescription to ${phone}: ${errorMsg}`);

      await this.communicationService.logMessage({
        pharmacyId: pharmacy.id,
        patientId: patient.id,
        medium: NotificationMedium.WHATSAPP,
        status: DeliveryStatus.FAILED,
        content: message,
      });

      return { success: false, error: error.response?.data?.error || error.message };
    }
  }

  async sendGroupedReminderMessage(patient: any, pharmacy: any, prescriptions: any[], timeString: string) {
    const firstName = decrypt(patient.firstNameEncrypted).trim();
    const phone = this.formatPhoneNumber(decrypt(patient.phoneEncrypted));

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

      const response = await axios.post(url, templatePayload, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const messageId = response.data.messages[0]?.id;
      this.logger.log(`WhatsApp Grouped Reminder sent to ${phone}. Message ID: ${messageId}`);

      await this.communicationService.logMessage({
        pharmacyId: pharmacy.id,
        patientId: patient.id,
        medium: NotificationMedium.WHATSAPP,
        providerId: messageId ? String(messageId) : undefined,
        status: DeliveryStatus.PENDING,
        content: message,
      });

      return { success: true, messageId };
    } catch (error: any) {
      const errorMsg = error.response?.data?.error?.message || error.message;
      this.logger.error(`Failed to send WhatsApp Grouped Template to ${phone}: ${errorMsg}`);

      await this.communicationService.logMessage({
        pharmacyId: pharmacy.id,
        patientId: patient.id,
        medium: NotificationMedium.WHATSAPP,
        status: DeliveryStatus.FAILED,
        content: message,
      });

      return { success: false, error: error.response?.data?.error || error.message };
    }
  }

  private formatPhoneNumber(phone: string) {
    // Meta requires numbers in international format without '+' or '00'
    // E.g. +233244123456 -> 233244123456
    return phone.replace(/\D/g, '');
  }

  private formatDate(date: Date) {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}
