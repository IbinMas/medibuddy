import { Injectable, Logger } from '@nestjs/common';
import { decrypt } from '../crypto/encryption';
import axios from 'axios';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  private readonly smsApiKey = process.env.SMS_API_KEY;
  private readonly smsSenderId = process.env.SMS_SENDER_ID || 'MediBuddy';
  // Use the exact URL provided by the user, but Arkesel is the correct spelling for the official service.
  // We'll use the user's provided URL format.
  private readonly smsApiUrl = 'https://sms.arkesel.com/api/v2/sms/send';

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
      const response = await axios.post(
        this.smsApiUrl,
        {
          sender: this.smsSenderId,
          message: message,
          recipients: [phone],
        },
        {
          headers: {
            'api-key': this.smsApiKey,
            'Authorization': `Bearer ${this.smsApiKey}`,
          },
        },
      );

      this.logger.log(`SMS sent to ${phone}. Response: ${JSON.stringify(response.data)}`);
      
      const resData = response.data.data;
      const messageId = (Array.isArray(resData) ? resData[0]?.id : resData?.id) || response.data.id || response.data.main_id;

      return { success: true, data: response.data, messageId };
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
      const response = await axios.post(
        this.smsApiUrl,
        {
          sender: this.smsSenderId,
          message: message,
          recipients: [phone],
        },
        {
          headers: {
            'api-key': this.smsApiKey,
            'Authorization': `Bearer ${this.smsApiKey}`,
          },
        },
      );
      this.logger.log(`Grouped SMS sent to ${phone}. Response: ${JSON.stringify(response.data)}`);
      
      const resData = response.data.data;
      const messageId = (Array.isArray(resData) ? resData[0]?.id : resData?.id) || response.data.id || response.data.main_id;

      return { success: true, data: response.data, messageId };
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
      const response = await axios.post(
        this.smsApiUrl,
        {
          sender: this.smsSenderId,
          message: message,
          recipients: [phone],
        },
        {
          headers: {
            'api-key': this.smsApiKey,
            'Authorization': `Bearer ${this.smsApiKey}`,
          },
        },
      );

      this.logger.log(`SMS Grouped Reminder sent to ${phone}. Response: ${JSON.stringify(response.data)}`);
      
      const resData = response.data.data;
      const messageId = (Array.isArray(resData) ? resData[0]?.id : resData?.id) || response.data.id || response.data.main_id;

      return { success: true, data: response.data, messageId };
    } catch (error: any) {
      this.logger.error(`Failed to send SMS Grouped Reminder: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async getSmsStatus(messageId: string) {
    if (!this.smsApiKey || !messageId) {
      return null;
    }

    try {
      const url = `https://sms.arkesel.com/api/v2/sms/${messageId}`;
      const response = await axios.get(url, {
        headers: {
          'api-key': this.smsApiKey,
        },
      });
      
      const data = response.data;
      this.logger.log(`Status for ${messageId}: ${JSON.stringify(data)}`);

      // Extracts the status from the nested data object: response.data.data.status
      const status = data.data?.status || data.status;
      return status ? String(status).trim().toUpperCase() : null;
    } catch (error: any) {
      this.logger.error(`Failed to check SMS status for ${messageId}: ${error.message}`);
      return null;
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
