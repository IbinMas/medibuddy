import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../database/prisma.service';
import { MailerService } from '../common/mailer/mailer.service';
import { AuthTokenType, InviteStatus, Role } from '@prisma/client';

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
    sendVerificationEmail: jest.fn().mockResolvedValue({ sent: true }),
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

  it('creates verification and reset tokens', async () => {
    (prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        id: 'user-1',
        email: 'admin@kwasi.test',
        pharmacyId: 'pharmacy-1',
        emailVerifiedAt: null,
      })
      .mockResolvedValueOnce({
        id: 'user-1',
        email: 'admin@kwasi.test',
        pharmacyId: 'pharmacy-1',
      });

    (prisma.authToken.create as jest.Mock).mockResolvedValueOnce({
      code: 'verify-code',
      type: AuthTokenType.EMAIL_VERIFICATION,
    });
    (prisma.authToken.create as jest.Mock).mockResolvedValueOnce({
      code: 'reset-code',
      type: AuthTokenType.PASSWORD_RESET,
    });
    (prisma.authToken.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        userId: 'user-1',
        type: AuthTokenType.EMAIL_VERIFICATION,
        usedAt: null,
        expiresAt: new Date(Date.now() + 1000),
      })
      .mockResolvedValueOnce({
        userId: 'user-1',
        type: AuthTokenType.PASSWORD_RESET,
        usedAt: null,
        expiresAt: new Date(Date.now() + 1000),
      });
    (prisma.user.update as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'admin@kwasi.test',
      role: Role.ADMIN,
      pharmacyId: 'pharmacy-1',
      emailVerifiedAt: new Date(),
    });

    await service.requestEmailVerification('admin@kwasi.test');
    await service.verifyEmail('verify-code');
    await service.requestPasswordReset('admin@kwasi.test');
    await service.resetPassword('reset-code', 'NewPassword123');

    expect(mailerService.sendVerificationEmail).toHaveBeenCalled();
    expect(mailerService.sendPasswordResetEmail).toHaveBeenCalled();
    expect((prisma.authToken.update as jest.Mock).mock.calls).toHaveLength(2);
    expect(bcrypt.hash).toBeDefined();
  });
});
