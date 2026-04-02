import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class ReminderQueueService implements OnModuleInit {
  private readonly logger = new Logger(ReminderQueueService.name);
  private reminderQueue: Queue | null = null;

  static redisAvailable = false;

  async onModuleInit() {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = parseInt(process.env.REDIS_PORT || '6379');

    // Quick TCP check before initializing BullMQ
    const canConnect = await this.checkRedis(host, port);

    if (!canConnect) {
      this.logger.warn(
        `⚠️  Redis not reachable at ${host}:${port}. ` +
        `Reminder scheduling is in SIMULATION MODE. ` +
        `Run "sudo apt install redis -y && redis-server &" to enable live scheduling.`,
      );
      ReminderQueueService.redisAvailable = false;
      return;
    }

    this.reminderQueue = new Queue('reminder-queue', {
      connection: { host, port },
    });
    ReminderQueueService.redisAvailable = true;
    this.logger.log('✅ Reminder queue connected to Redis. Live scheduling enabled.');
  }

  async scheduleReminder(payload: {
    pharmacyId: string;
    patientId: string;
    prescriptionId: string;
    scheduledAt: string;
    medium: string;
  }) {
    if (!ReminderQueueService.redisAvailable || !this.reminderQueue) {
      this.logger.log(
        `[Simulation] Reminder for patient ${payload.patientId} at ${payload.scheduledAt} via [${payload.medium}]`,
      );
      return { queued: false, mode: 'simulation', scheduledAt: payload.scheduledAt };
    }

    const delay = Math.max(0, new Date(payload.scheduledAt).getTime() - Date.now());

    const job = await this.reminderQueue.add('send-reminder', payload, {
      delay,
      removeOnComplete: true,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });

    this.logger.log(
      `Queued reminder for patient ${payload.patientId} in ${Math.round(delay / 60000)} min (Job ${job.id})`,
    );
    return { queued: true, jobId: job.id, scheduledAt: payload.scheduledAt };
  }

  /** Lightweight TCP check — does NOT create persistent connections */
  private checkRedis(host: string, port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const net = require('net');
      const socket = new net.Socket();
      const timeout = 1000;

      socket.setTimeout(timeout);
      socket.on('connect', () => { socket.destroy(); resolve(true); });
      socket.on('timeout', () => { socket.destroy(); resolve(false); });
      socket.on('error', () => { socket.destroy(); resolve(false); });
      socket.connect(port, host);
    });
  }
}
