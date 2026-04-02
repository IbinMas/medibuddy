import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';
import { WhatsappService } from '../common/whatsapp/whatsapp.service';
import { SmsService } from '../common/sms/sms.service';
import { decrypt } from '../common/crypto/encryption';

@Injectable()
export class ReminderCronService {
  private readonly logger = new Logger(ReminderCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappService: WhatsappService,
    private readonly smsService: SmsService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
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
      const groupedByPatient: Record<string, any[]> = {};

      for (const presc of activePrescriptions) {
        const prescription = presc as any;
        if (!prescription.patient || !prescription.pharmacy) continue;
        if (prescription.patient.notificationMedium !== 'WHATSAPP' && prescription.patient.notificationMedium !== 'SMS') continue;

        const freq = prescription.frequency.toLowerCase();
        let times: string[] = ['08:00'];

        if (freq.includes('2') || freq.includes('twice')) {
          times = ['08:00', '20:00'];
        } else if (freq.includes('3') || freq.includes('three')) {
          times = ['08:00', '14:00', '20:00'];
        } else if (freq.includes('4') || freq.includes('four')) {
          times = ['06:00', '12:00', '18:00', '00:00'];
        }

        // Check if the current hour matches the schedule
        if (times.includes(currentHourString)) {
          if (!groupedByPatient[prescription.patientId]) {
            groupedByPatient[prescription.patientId] = [];
          }
          groupedByPatient[prescription.patientId].push({
            ...prescription,
            medication: decrypt(prescription.medicationEncrypted),
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
          await this.whatsappService.sendGroupedReminderMessage(
            patient,
            pharmacy,
            prescriptions,
            currentHourString
          );
        } else if (patient.notificationMedium === 'SMS') {
          await this.smsService.sendGroupedReminderMessage(
            patient,
            pharmacy,
            prescriptions,
            currentHourString
          );
        }
      }
    } catch (error) {
      this.logger.error('Failed to process grouped reminders', error);
    }
  }
}
