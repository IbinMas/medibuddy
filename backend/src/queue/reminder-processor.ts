import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { PrismaService } from '../database/prisma.service';
import { WhatsappService } from '../common/whatsapp/whatsapp.service';
import { SmsService } from '../common/sms/sms.service';

@Injectable()
export class ReminderProcessor implements OnModuleInit {
  private readonly logger = new Logger(ReminderProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappService: WhatsappService,
    private readonly smsService: SmsService,
  ) {}

  async onModuleInit() {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = parseInt(process.env.REDIS_PORT || '6379');

    const canConnect = await this.checkRedis(host, port);

    if (!canConnect) {
      this.logger.warn('Worker not started — Redis unavailable. Reminders will run in simulation mode.');
      return;
    }

    const worker = new Worker(
      'reminder-queue',
      async (job: Job) => {
        if (job.name === 'send-reminder') {
          await this.processReminder(job.data);
        }
      },
      { connection: { host, port } },
    );

    worker.on('completed', (job) => {
      this.logger.log(`✅ Reminder Job ${job.id} completed.`);
    });

    worker.on('failed', (job, err) => {
      this.logger.error(`❌ Reminder Job ${job?.id} failed: ${err.message}`);
    });

    this.logger.log('✅ Reminder Worker started and listening for jobs.');
  }

  private async processReminder(data: {
    pharmacyId: string;
    patientId: string;
    prescriptionId: string;
    medium: string;
  }) {
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
    } else if (data.medium === 'SMS') {
      const smsResponse = await this.smsService.sendPrescriptionMessage(patient, pharmacy, prescription);
      if (smsResponse.success && smsResponse.messageId) {
        await this.prisma.prescription.update({
          where: { id: prescription.id },
          data: { messageId: String(smsResponse.messageId) }
        });
      }
    } else {
      this.logger.warn(`Medium [${data.medium}] not yet implemented in worker.`);
    }
  }

  /** Lightweight TCP check — does NOT create persistent connections */
  private checkRedis(host: string, port: number): Promise<boolean> {
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
}
