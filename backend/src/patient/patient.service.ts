import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Plan } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { encrypt, decrypt } from '../common/crypto/encryption';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PatientService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(pharmacyId: string, userId: string | undefined, dto: CreatePatientDto) {
    const pharmacy = await this.prisma.pharmacy.findUnique({
      where: { id: pharmacyId },
      select: { plan: true },
    });

    if (pharmacy?.plan === Plan.BASIC) {
      const count = await this.prisma.patient.count({
        where: { pharmacyId, deletedAt: null },
      });
      if (count >= 50) {
        throw new BadRequestException(
          'Patient limit reached for Free Plan (50 patients). Please upgrade to Premium.',
        );
      }
    }

    const patient = await this.prisma.patient.create({
      data: {
        pharmacyId,
        firstNameEncrypted: encrypt(dto.firstName),
        lastNameEncrypted: encrypt(dto.lastName),
        phoneEncrypted: encrypt(dto.phone),
        allergiesEncrypted: dto.allergies ? encrypt(dto.allergies) : null,
        notesEncrypted: dto.notes ? encrypt(dto.notes) : null,
        notificationMedium: dto.notificationMedium ?? 'NONE',
      },
    });

    await this.auditService.logAction({
      pharmacyId,
      userId,
      action: 'CREATE',
      entity: 'Patient',
      entityId: patient.id,
      metadata: { firstName: dto.firstName, lastName: dto.lastName },
    });

    return patient;
  }

  async update(patientId: string, pharmacyId: string, userId: string | undefined, dto: UpdatePatientDto) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, pharmacyId, deletedAt: null },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const updateData: any = {};
    if (dto.firstName) updateData.firstNameEncrypted = encrypt(dto.firstName);
    if (dto.lastName) updateData.lastNameEncrypted = encrypt(dto.lastName);
    if (dto.phone) updateData.phoneEncrypted = encrypt(dto.phone);
    if (dto.allergies !== undefined) {
      updateData.allergiesEncrypted = dto.allergies ? encrypt(dto.allergies) : null;
    }
    if (dto.notes !== undefined) {
      updateData.notesEncrypted = dto.notes ? encrypt(dto.notes) : null;
    }
    if (dto.notificationMedium) updateData.notificationMedium = dto.notificationMedium;

    const updated = await this.prisma.patient.update({
      where: { id: patientId },
      data: updateData,
    });

    await this.auditService.logAction({
      pharmacyId,
      userId,
      action: 'UPDATE',
      entity: 'Patient',
      entityId: updated.id,
      metadata: { fields: Object.keys(dto) },
    });

    return updated;
  }

  async list(pharmacyId: string, page: number = 1, limit: number = 20, search?: string) {
    const patients = await this.prisma.patient.findMany({
      where: { pharmacyId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    let decrypted = patients.map((patient) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { firstNameEncrypted, lastNameEncrypted, ...rest } = patient;
      return {
        ...rest,
        firstName: decrypt(patient.firstNameEncrypted),
        lastName: decrypt(patient.lastNameEncrypted),
        phone: decrypt(patient.phoneEncrypted),
        allergies: patient.allergiesEncrypted ? decrypt(patient.allergiesEncrypted) : null,
        notes: patient.notesEncrypted ? decrypt(patient.notesEncrypted) : null,
        notificationMedium: patient.notificationMedium,
      };
    });

    if (search) {
      const s = search.toLowerCase();
      decrypted = decrypted.filter(
        (p) =>
          p.firstName.toLowerCase().includes(s) ||
          p.lastName.toLowerCase().includes(s) ||
          p.phone.includes(s),
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

  async getDecryptedHistory(patientId: string, pharmacyId: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, pharmacyId, deletedAt: null },
      include: {
        prescriptions: {
          include: { adherence: true },
        },
      },
    });

    if (!patient) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { firstNameEncrypted, lastNameEncrypted, ...rest } = patient;
    return {
      ...rest,
      firstName: decrypt(patient.firstNameEncrypted),
      lastName: decrypt(patient.lastNameEncrypted),
      phone: decrypt(patient.phoneEncrypted),
      allergies: patient.allergiesEncrypted ? decrypt(patient.allergiesEncrypted) : null,
      notes: patient.notesEncrypted ? decrypt(patient.notesEncrypted) : null,
      notificationMedium: patient.notificationMedium,
    };
  }

  async softDelete(patientId: string, pharmacyId: string, userId?: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, pharmacyId, deletedAt: null },
    });

    if (!patient) {
      return null;
    }

    const deleted = await this.prisma.patient.update({
      where: { id: patientId },
      data: { deletedAt: new Date() },
    });

    await this.auditService.logAction({
      pharmacyId,
      userId,
      action: 'DELETE',
      entity: 'Patient',
      entityId: deleted.id,
      metadata: { deletedAt: deleted.deletedAt },
    });

    return deleted;
  }
}
