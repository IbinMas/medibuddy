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

    const search = query.search?.trim().toLowerCase();
    const filteredLogs = search
      ? decryptedLogs.filter((log: any) => {
          const content = String(log.content ?? '').toLowerCase();
          const firstName = String(log.patient?.firstName ?? '').toLowerCase();
          const lastName = String(log.patient?.lastName ?? '').toLowerCase();
          const phone = String(log.patient?.phone ?? '').toLowerCase();
          return (
            content.includes(search) ||
            firstName.includes(search) ||
            lastName.includes(search) ||
            phone.includes(search)
          );
        })
      : decryptedLogs;

    const filteredTotal = search ? filteredLogs.length : total;
    const startIndex = (page - 1) * limit;
    const paginatedData = filteredLogs.slice(startIndex, startIndex + limit);

    return {
      data: paginatedData,
      total: filteredTotal,
      page,
      limit,
      totalPages: Math.ceil(filteredTotal / limit),
    };
  }
}
