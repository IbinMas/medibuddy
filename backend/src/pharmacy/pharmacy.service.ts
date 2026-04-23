import { Injectable, BadRequestException } from '@nestjs/common';
import { AuthTokenType, Plan, Role, SubscriptionStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../database/prisma.service';
import { OnboardPharmacyDto } from './dto/onboard-pharmacy.dto';
import { MailerService } from '../common/mailer/mailer.service';
import { randomUUID } from 'crypto';

@Injectable()
export class PharmacyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailerService: MailerService,
  ) {}

  async onboardPharmacy(dto: OnboardPharmacyDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.adminEmail },
    });
    if (existingUser) {
      throw new BadRequestException('Admin email already exists');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const pharmacy = await tx.pharmacy.create({
        data: {
          name: dto.name,
          phone: dto.phone,
          plan: dto.plan ?? Plan.BASIC,
          users: {
            create: {
              email: dto.adminEmail,
              password: await bcrypt.hash(dto.password, 10),
              role: Role.ADMIN,
              emailVerifiedAt: new Date(),
            },
          },
          subscriptions: {
            create: {
              plan: dto.plan ?? Plan.BASIC,
              status: SubscriptionStatus.ACTIVE,
              expiresAt: addDays(new Date(), 30),
            },
          },
        },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              role: true,
              pharmacyId: true,
              emailVerifiedAt: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          subscriptions: true,
        },
      });

      const adminUser = pharmacy.users[0];

      await tx.auditLog.create({
        data: {
          pharmacyId: pharmacy.id,
          userId: adminUser.id,
          action: 'CREATE',
          entity: 'Pharmacy',
          entityId: pharmacy.id,
          metadata: { plan: pharmacy.plan, status: 'ONBOARDED' },
        },
      });

      return { pharmacy, adminUser };
    });

    return result.pharmacy;
  }

  findOne(pharmacyId: string) {
    return this.prisma.pharmacy.findUnique({
      where: { id: pharmacyId },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            role: true,
            pharmacyId: true,
            emailVerifiedAt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        subscriptions: true,
      },
    });
  }

  async update(pharmacyId: string, dto: { name?: string, phone?: string }) {
    return this.prisma.pharmacy.update({
      where: { id: pharmacyId },
      data: {
        name: dto.name,
        phone: dto.phone,
      },
    });
  }
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addHours(date: Date, hours: number) {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

function buildAppBaseUrl() {
  return (
    process.env.APP_URL ??
    process.env.FRONTEND_URL ??
    'http://127.0.0.1:3000'
  ).replace(/\/$/, '');
}
