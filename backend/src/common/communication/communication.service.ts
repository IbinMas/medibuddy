import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { decrypt } from '../crypto/encryption';
import { NotificationMedium, DeliveryStatus } from '@prisma/client';

@Injectable()
export class CommunicationService {
  private readonly logger = new Logger(CommunicationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async logMessage(data: {
    pharmacyId: string;
    patientId: string;
    prescriptionId?: string;
    medium: NotificationMedium;
    providerId?: string;
    status: DeliveryStatus;
    content: string;
  }) {
    try {
      return await this.prisma.communicationLog.create({
        data: {
          pharmacyId: data.pharmacyId,
          patientId: data.patientId,
          prescriptionId: data.prescriptionId,
          medium: data.medium,
          providerId: data.providerId,
          status: data.status,
          content: data.content,
        },
      });
    } catch (error: any) {
      this.logger.error(`Failed to log message: ${error.message}`);
      // Don't throw — logging shouldn't break the main flow
    }
  }

  async updateStatus(providerId: string, status: DeliveryStatus) {
    try {
      return await this.prisma.communicationLog.update({
        where: { providerId },
        data: { status },
      });
    } catch (error: any) {
      this.logger.warn(`Could not update message status for ${providerId}: ${error.message}`);
    }
  }

  async findAll(
    pharmacyId: string, 
    query: { page?: number; limit?: number; search?: string; status?: DeliveryStatus }
  ) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = { pharmacyId };

    if (query.status) {
      where.status = query.status;
    }

    const [logs, total] = await Promise.all([
      this.prisma.communicationLog.findMany({
        where,
        include: {
          patient: {
            select: {
              firstNameEncrypted: true,
              lastNameEncrypted: true,
              phoneEncrypted: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.communicationLog.count({ where }),
    ]);

    const decryptedLogs = logs.map((log: any) => ({
      ...log,
      patient: {
        ...log.patient,
        firstName: decrypt(log.patient.firstNameEncrypted),
        lastName: decrypt(log.patient.lastNameEncrypted),
        phone: decrypt(log.patient.phoneEncrypted),
      }
    }));

    return {
      data: decryptedLogs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
