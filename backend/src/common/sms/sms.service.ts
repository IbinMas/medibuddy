import { Injectable, Logger } from '@nestjs/common';
import { decrypt } from '../crypto/encryption';
import axios from 'axios';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  private readonly smsApiKey = process.env.SMS_API_KEY;
  private readonly smsSenderId = process.env.SMS_SENDER_ID || 'MediBuddy';
  private readonly smsApiUrl = process.env.SMS_API_URL || 'https://sms.arkesel.com/sms/api';

  async sendPrescriptionMessage(patient: any, pharmacy: any, prescription: any) {
    const firstName = decrypt(patient.firstNameEncrypted).trim();
    const phone = decrypt(patient.phoneEncrypted).trim(); 
    const medication = decrypt(prescription.medicationEncrypted);

    const timingText = prescription.mealTiming === 'BEFORE_MEAL' ? 'Before Meal' : (prescription.mealTiming === 'AFTER_MEAL' ? 'After Meal' : '');
    const timingStr = timingText ? ` (${timingText})` : '';

    const message = `Hi ${firstName}, ${pharmacy.name} prescribed: ${medication}, ${prescription.dosage}, ${prescription.frequency}${timingStr}. Use from ${this.formatDate(prescription.startDate)} to ${this.formatDate(prescription.endDate)}.`;

    if (!this.smsApiKey) {
      this.logger.warn('SMS API Key not found in environment. Simulation mode enabled.');
      this.logger.log(`[SMS Simulation] To: ${phone}\nMessage: ${message}`);
      return { success: false, mode: 'simulation', phone };
    }

    try {
      const url = `${this.smsApiUrl}?action=send-sms&api_key=${this.smsApiKey}&to=${phone}&from=${this.smsSenderId}&sms=${encodeURIComponent(message)}`;
      
      const response = await axios.get(url);

      this.logger.log(`SMS sent to ${phone}. URL: ${url.replace(this.smsApiKey as string, 'REDACTED')}`);
      this.logger.log(`Response: ${JSON.stringify(response.data)}`);
      
      return { success: true, data: response.data };
    } catch (error: any) {
      this.logger.error(
        `Failed to send SMS to ${phone}: ${error.message}`,
      );
      return { success: false, error: error.message };
    }
  }

  async sendGroupedPrescriptionMessage(patient: any, pharmacy: any, prescriptions: any[]) {
    const firstName = decrypt(patient.firstNameEncrypted).trim();
    const phone = decrypt(patient.phoneEncrypted).trim(); 

    const medList = prescriptions.map((p, i) => `${i + 1}. ${p.medication} (${p.dosage}, ${p.frequency})`).join('; ');
    const message = `Hi ${firstName}, ${pharmacy.name} prescribed: ${medList}. Check your schedule for details.`;

    if (!this.smsApiKey) {
      this.logger.warn('SMS API Key not found in environment. Simulation mode enabled.');
      this.logger.log(`[Grouped SMS Simulation] To: ${phone}\nMessage: ${message}`);
      return { success: false, mode: 'simulation', phone };
    }

    try {
      const url = `${this.smsApiUrl}?action=send-sms&api_key=${this.smsApiKey}&to=${phone}&from=${this.smsSenderId}&sms=${encodeURIComponent(message)}`;
      const response = await axios.get(url);
      this.logger.log(`Grouped SMS sent to ${phone}. Response: ${JSON.stringify(response.data)}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      this.logger.error(`Failed to send Grouped SMS to ${phone}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async sendGroupedReminderMessage(patient: any, pharmacy: any, prescriptions: any[], timeString: string) {
    const firstName = decrypt(patient.firstNameEncrypted).trim();
    const phone = decrypt(patient.phoneEncrypted).trim();

    const medList = prescriptions.map((p, i) => `${i + 1}. ${p.medication} (${p.dosage})`).join(', ');

    const message = `Reminder (${timeString}): Hi ${firstName}, it's time to take your medications: ${medList}. From ${pharmacy.name}.`;

    if (!this.smsApiKey) {
      this.logger.warn('SMS API Key not found in environment. Simulation mode enabled.');
      this.logger.log(`[Grouped SMS Simulation] To: ${phone}\nMessage: ${message}`);
      return { success: false, mode: 'simulation', phone };
    }

    try {
      const url = `${this.smsApiUrl}?action=send-sms&api_key=${this.smsApiKey}&to=${phone}&from=${this.smsSenderId}&sms=${encodeURIComponent(message)}`;
      
      const response = await axios.get(url);

      this.logger.log(`SMS Grouped Reminder sent to ${phone}. Response: ${JSON.stringify(response.data)}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      this.logger.error(`Failed to send SMS Grouped Reminder: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  private formatDate(date: Date) {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}
