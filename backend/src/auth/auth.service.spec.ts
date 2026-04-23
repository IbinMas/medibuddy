import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../database/prisma.service';
import { MailerService } from '../common/mailer/mailer.service';
import { InviteStatus, Role } from '@prisma/client';

describe('AuthService lifecycle', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    invite: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    pharmacy: {
      findUnique: jest.fn(),
    },
    authToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn(async (callback: (tx: any) => Promise<any>) => callback(prisma as any)),
  } as unknown as PrismaService;

  const jwtService = {
    sign: jest.fn(() => 'signed-token'),
  } as unknown as JwtService;

  const mailerService = {
    sendInviteEmail: jest.fn().mockResolvedValue({ sent: true }),
    sendPasswordResetEmail: jest.fn().mockResolvedValue({ sent: true }),
  } as unknown as MailerService;

  const service = new AuthService(prisma, jwtService, mailerService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates and emails an invite, scoped to the pharmacy', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.invite.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.invite.create as jest.Mock).mockResolvedValue({
      id: 'invite-1',
      pharmacyId: 'pharmacy-1',
      email: 'staff@kwasi.test',
      role: Role.ASSISTANT,
      code: 'invite-code',
      status: InviteStatus.PENDING,
    });
    (prisma.pharmacy.findUnique as jest.Mock).mockResolvedValue({ name: 'Kwasi Pharmacy' });

    await service.createInvite('pharmacy-1', 'admin-1', {
      email: 'staff@kwasi.test',
      role: Role.ASSISTANT,
    });

    expect((prisma.invite.findFirst as jest.Mock).mock.calls[0][0]).toEqual({
      where: {
        pharmacyId: 'pharmacy-1',
        email: 'staff@kwasi.test',
        status: InviteStatus.PENDING,
      },
    });
    expect(mailerService.sendInviteEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'staff@kwasi.test',
        pharmacyName: 'Kwasi Pharmacy',
      }),
    );
  });

  it('resends invites with a new code and emails the updated link', async () => {
    (prisma.invite.findFirst as jest.Mock).mockResolvedValue({
      id: 'invite-1',
      pharmacyId: 'pharmacy-1',
      email: 'staff@kwasi.test',
      role: Role.ASSISTANT,
      status: InviteStatus.PENDING,
    });
    (prisma.invite.update as jest.Mock).mockResolvedValue({
      id: 'invite-1',
      pharmacyId: 'pharmacy-1',
      email: 'staff@kwasi.test',
      role: Role.ASSISTANT,
      status: InviteStatus.PENDING,
      code: 'new-code',
    });
    (prisma.pharmacy.findUnique as jest.Mock).mockResolvedValue({ name: 'Kwasi Pharmacy' });

    const result = await service.resendInvite('pharmacy-1', 'invite-1', 'admin-1');

    expect(result.invite.code).toBe('new-code');
    expect(mailerService.sendInviteEmail).toHaveBeenCalledWith(
      expect.objectContaining({ acceptUrl: expect.stringContaining('new-code') }),
    );
  });

  it('revokes invites within the tenant', async () => {
    (prisma.invite.findFirst as jest.Mock).mockResolvedValue({
      id: 'invite-1',
      pharmacyId: 'pharmacy-1',
      email: 'staff@kwasi.test',
      role: Role.ASSISTANT,
      status: InviteStatus.PENDING,
    });
    (prisma.invite.update as jest.Mock).mockResolvedValue({
      id: 'invite-1',
      status: InviteStatus.CANCELLED,
    });

    const revoked = await service.revokeInvite('pharmacy-1', 'invite-1', 'admin-1');

    expect(revoked.status).toBe(InviteStatus.CANCELLED);
  });

  it('allows login immediately after signup and creates reset tokens', async () => {
    const hashedPassword = await bcrypt.hash('Password123', 10);

    (prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        id: 'user-1',
        email: 'admin@kwasi.test',
        password: hashedPassword,
        role: Role.ADMIN,
        pharmacyId: 'pharmacy-1',
        emailVerifiedAt: null,
      })
      .mockResolvedValueOnce({
        id: 'user-1',
        email: 'admin@kwasi.test',
        pharmacyId: 'pharmacy-1',
      });

    (prisma.pharmacy.findUnique as jest.Mock).mockResolvedValue({ name: 'Kwasi Pharmacy' });
    (prisma.authToken.create as jest.Mock).mockResolvedValue({
      code: 'reset-code',
    });

    const loginResult = await service.login({
      email: 'admin@kwasi.test',
      password: 'Password123',
    });
    await service.requestPasswordReset('admin@kwasi.test');

    expect(loginResult.accessToken).toBe('signed-token');
    expect(mailerService.sendPasswordResetEmail).toHaveBeenCalledWith(
      expect.objectContaining({ pharmacyName: 'Kwasi Pharmacy' }),
    );
  });
});
