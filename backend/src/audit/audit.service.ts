import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  logAction(dto: {
    pharmacyId: string;
    userId?: string;
    action: string;
    entity: string;
    entityId: string;
    metadata?: object;
  }) {
    return this.prisma.auditLog.create({
      data: {
        ...dto,
        metadata: dto.metadata as any,
      },
    });
  }

  async list(pharmacyId: string, page: number = 1, limit: number = 50) {
    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { pharmacyId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: { email: true, role: true },
          },
        },
      }),
      this.prisma.auditLog.count({ where: { pharmacyId } }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
