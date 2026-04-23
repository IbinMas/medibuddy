import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { encrypt, decrypt } from '../common/crypto/encryption';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { AuditService } from '../audit/audit.service';
import { ReminderQueueService } from '../queue/reminder-queue.service';
import { WhatsappService } from '../common/whatsapp/whatsapp.service';
import { SmsService } from '../common/sms/sms.service';

@Injectable()
export class PrescriptionService {
  private readonly logger = new Logger(PrescriptionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly reminderQueue: ReminderQueueService,
    private readonly whatsappService: WhatsappService,
    private readonly smsService: SmsService,
  ) {}

  async create(pharmacyId: string, userId: string | undefined, dto: CreatePrescriptionDto) {
    return this.bulkCreate(pharmacyId, userId, [dto]);
  }

  async bulkCreate(pharmacyId: string, userId: string | undefined, dtos: CreatePrescriptionDto[]) {
    for (const dto of dtos) {
      const patient = await this.prisma.patient.findFirst({
        where: { id: dto.patientId, pharmacyId, deletedAt: null },
        select: { id: true },
      });

      if (!patient) {
        throw new NotFoundException('Patient not found');
      }
    }

    const results = await this.prisma.$transaction(async (tx) => {
      const creations = [];
      for (const dto of dtos) {
        const p = await tx.prescription.create({
          data: {
            pharmacyId,
            patientId: dto.patientId,
            medicationEncrypted: encrypt(dto.medication),
            dosage: dto.dosage,
            frequency: dto.frequency,
            mealTiming: dto.mealTiming,
            startDate: new Date(dto.startDate),
            endDate: new Date(dto.endDate),
          },
        });
        creations.push({ ...p, medication: dto.medication });
      }
      return creations;
    });

    // Send consolidated notification
    const firstPresc = results[0];
    const patient = await this.prisma.patient.findUnique({ where: { id: firstPresc.patientId } });
    const pharmacy = await this.prisma.pharmacy.findUnique({ where: { id: pharmacyId } });

    if (patient && pharmacy && (patient.notificationMedium === 'WHATSAPP' || patient.notificationMedium === 'SMS')) {
      // In a real scenario, we'd have a sendGroupedInitialMessage. 
      // For now, let's reuse/adapt the logic or just loop if necessary, but the USER wants them BUNDLED.
      // I'll add sendGroupedInitialMessage to SmsService and WhatsappService.
      if (patient.notificationMedium === 'WHATSAPP') {
        await this.whatsappService.sendGroupedPrescriptionMessage(patient, pharmacy, results);
      } else if (patient.notificationMedium === 'SMS') {
        this.logger.log(`Sending grouped SMS for ${results.length} prescriptions...`);
        const smsResponse = await this.smsService.sendGroupedPrescriptionMessage(patient, pharmacy, results);
        this.logger.log(`SMS Response: ${JSON.stringify(smsResponse)}`);

        if (smsResponse.success && smsResponse.messageId) {
          const ids = results.map(r => r.id);
          this.logger.log(`Updating ${ids.length} prescriptions with messageId: ${smsResponse.messageId}. IDs: ${ids.join(', ')}`);
          
          const updateResult = await this.prisma.prescription.updateMany({
            where: { id: { in: ids } },
            data: { messageId: String(smsResponse.messageId) }
          });
          this.logger.log(`Update call finished. count: ${updateResult.count}`);
        } else {
          this.logger.warn(`Failed to update prescriptions: Success=${smsResponse.success}, messageId=${smsResponse.messageId}, mode=${(smsResponse as any).mode}`);
        }
      }
    }

    // Single Audit Log for the batch
    await this.auditService.logAction({
      pharmacyId,
      userId,
      action: 'CREATE',
      entity: 'Prescription',
      entityId: results.map(r => r.id).join(','),
      metadata: { count: dtos.length, medications: dtos.map(d => d.medication).join(', ') },
    });

    return results;
  }

  history(patientId: string, pharmacyId: string) {
    return this.prisma.prescription.findMany({
      where: { patientId, pharmacyId },
      include: { adherence: true },
      orderBy: { createdAt: 'desc' },
    }).then((prescriptions) =>
      prescriptions.map((prescription) => ({
        ...prescription,
        medication: decrypt(prescription.medicationEncrypted),
      })),
    );
  }

  async findAll(pharmacyId: string, page: number = 1, limit: number = 20, search?: string) {
    const prescriptions = await this.prisma.prescription.findMany({
      where: { pharmacyId },
      include: { patient: true },
      orderBy: { createdAt: 'desc' },
    });

    let decrypted = prescriptions.map((p) => ({
      ...p,
      medication: decrypt(p.medicationEncrypted),
      patient: {
        ...p.patient,
        firstName: decrypt(p.patient.firstNameEncrypted),
        lastName: decrypt(p.patient.lastNameEncrypted),
      },
    }));

    if (search) {
      const s = search.toLowerCase();
      decrypted = decrypted.filter(
        (p) =>
          p.medication.toLowerCase().includes(s) ||
          p.patient.firstName.toLowerCase().includes(s) ||
          p.patient.lastName.toLowerCase().includes(s),
      );
    }

    const total = decrypted.length;
    const startIndex = (page - 1) * limit;
    const paginatedData = decrypted.slice(startIndex, startIndex + limit);

    return {
      data: paginatedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
