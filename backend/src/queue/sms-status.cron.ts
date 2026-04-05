import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';
import { SmsService } from '../common/sms/sms.service';
import { CommunicationService } from '../common/communication/communication.service';
import { DeliveryStatus } from '@prisma/client';

@Injectable()
export class SmsStatusCronService {
  private readonly logger = new Logger(SmsStatusCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly smsService: SmsService,
    private readonly communicationService: CommunicationService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleSmsStatusUpdates() {
    this.logger.log('Checking SMS statuses from Arkesel...');

    try {
      // Find prescriptions that are pending and have a messageId
      const pendingPrescriptions = await this.prisma.prescription.findMany({
        where: {
          deliveryStatus: DeliveryStatus.PENDING,
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
        if (!presc.messageId) continue;

        const arkaselStatus = await this.smsService.getSmsStatus(presc.messageId);
        
        if (!arkaselStatus) {
          continue;
        }

        this.logger.log(`Arkasel status for ${presc.messageId}: ${arkaselStatus}`);

        let newStatus: DeliveryStatus | null = null;

        // Treat SUBMITTED as DELIVERED as per user requirement
        if (arkaselStatus === 'DELIVERED' || arkaselStatus === 'SUBMITTED' || arkaselStatus === 'SUCCESS') {
          newStatus = DeliveryStatus.DELIVERED;
        } else if (arkaselStatus === 'FAILED' || arkaselStatus === 'REJECTED' || arkaselStatus === 'EXPIRED') {
          newStatus = DeliveryStatus.FAILED;
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
    } catch (error) {
      this.logger.error('Failed to update SMS statuses', error);
    }
  }
}
