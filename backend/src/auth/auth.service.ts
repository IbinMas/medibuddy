import {
  ConflictException,
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthTokenType, InviteStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { CreateInviteDto } from './dto/create-invite.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { randomUUID } from 'crypto';
import { MailerService } from '../common/mailer/mailer.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        pharmacyId: true,
        emailVerifiedAt: true,
      },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerifiedAt) {
      throw new ForbiddenException('Email not verified');
    }

    return {
      user: { id: user.id, email: user.email, role: user.role, pharmacyId: user.pharmacyId },
      accessToken: this.jwtService.sign({ sub: user.id, pharmacyId: user.pharmacyId }),
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        pharmacyId: true,
        emailVerifiedAt: true,
        pharmacy: {
          select: {
            id: true,
            name: true,
            plan: true,
            users: {
              select: {
                id: true,
                email: true,
                role: true,
              },
            },
            subscriptions: {
              where: { status: 'ACTIVE' },
              take: 1,
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const data: any = {};

    if (dto.email && dto.email !== user.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existing) throw new ConflictException('Email already in use');
      data.email = dto.email;
      data.emailVerifiedAt = null; // Require re-verification
    }

    if (dto.password) {
      if (!dto.currentPassword) {
        throw new BadRequestException('Current password required to set new password');
      }
      const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
      if (!isMatch) throw new UnauthorizedException('Invalid current password');
      data.password = await bcrypt.hash(dto.password, 10);
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, email: true, role: true, pharmacyId: true },
    });

    if (data.email) {
      await this.requestEmailVerification(data.email);
    }

    return updated;
  }

  async createInvite(
    pharmacyId: string,
    createdByUserId: string,
    dto: CreateInviteDto,
  ) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const activeInvite = await this.prisma.invite.findFirst({
      where: {
        pharmacyId,
        email: dto.email,
        status: InviteStatus.PENDING,
      },
    });
    if (activeInvite) {
      throw new ConflictException('Invite already pending for this email');
    }

    const invite = await this.prisma.$transaction(async (tx) => {
      const created = await tx.invite.create({
        data: {
          pharmacyId,
          email: dto.email,
          role: dto.role,
          code: randomUUID(),
          expiresAt: addDays(new Date(), 7),
          createdByUserId,
        },
      });

      await tx.auditLog.create({
        data: {
          pharmacyId,
          userId: createdByUserId,
          action: 'CREATE',
          entity: 'Invite',
          entityId: created.id,
          metadata: { email: dto.email, role: dto.role, status: created.status },
        },
      });

      return created;
    });

    const acceptUrl = this.buildInviteAcceptUrl(invite.code);
    const emailResult = await this.mailerService.sendInviteEmail({
      to: invite.email,
      pharmacyName: await this.getPharmacyName(pharmacyId),
      role: invite.role,
      acceptUrl,
    });

    return {
      invite,
      acceptUrl,
      emailResult,
    };
  }

  async listInvites(pharmacyId: string) {
    await this.expireStaleInvites(pharmacyId);

    return this.prisma.invite.findMany({
      where: { pharmacyId },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async resendInvite(pharmacyId: string, inviteId: string, createdByUserId: string) {
    const invite = await this.prisma.invite.findFirst({
      where: { id: inviteId, pharmacyId },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.status === InviteStatus.ACCEPTED) {
      throw new BadRequestException('Accepted invites cannot be resent');
    }

    const updatedInvite = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.invite.update({
        where: { id: invite.id },
        data: {
          code: randomUUID(),
          status: InviteStatus.PENDING,
          expiresAt: addDays(new Date(), 7),
          acceptedAt: null,
        },
      });

      await tx.auditLog.create({
        data: {
          pharmacyId,
          userId: createdByUserId,
          action: 'UPDATE',
          entity: 'Invite',
          entityId: updated.id,
          metadata: { action: 'RESEND', email: updated.email, role: updated.role },
        },
      });

      return updated;
    });

    const acceptUrl = this.buildInviteAcceptUrl(updatedInvite.code);
    const emailResult = await this.mailerService.sendInviteEmail({
      to: updatedInvite.email,
      pharmacyName: await this.getPharmacyName(pharmacyId),
      role: updatedInvite.role,
      acceptUrl,
    });

    return {
      invite: updatedInvite,
      acceptUrl,
      emailResult,
    };
  }

  async revokeInvite(pharmacyId: string, inviteId: string, createdByUserId: string) {
    const invite = await this.prisma.invite.findFirst({
      where: { id: inviteId, pharmacyId },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.status === InviteStatus.ACCEPTED) {
      throw new BadRequestException('Accepted invites cannot be revoked');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const revoked = await tx.invite.update({
        where: { id: invite.id },
        data: { status: InviteStatus.CANCELLED },
      });

      await tx.auditLog.create({
        data: {
          pharmacyId,
          userId: createdByUserId,
          action: 'UPDATE',
          entity: 'Invite',
          entityId: revoked.id,
          metadata: { action: 'REVOKE', email: revoked.email, role: revoked.role },
        },
      });

      return revoked;
    });

    return updated;
  }

  async acceptInvite(dto: AcceptInviteDto) {
    const invite = await this.prisma.invite.findUnique({
      where: { code: dto.code },
    });

    if (!invite) {
      throw new BadRequestException('Invite not found');
    }

    if (invite.status !== InviteStatus.PENDING) {
      throw new BadRequestException('Invite is no longer active');
    }

    if (invite.expiresAt.getTime() < Date.now()) {
      await this.prisma.invite.update({
        where: { code: dto.code },
        data: { status: InviteStatus.EXPIRED },
      });
      throw new BadRequestException('Invite has expired');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: invite.email },
    });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: invite.email,
          password: await bcrypt.hash(dto.password, 10),
          role: invite.role,
          pharmacyId: invite.pharmacyId,
          emailVerifiedAt: new Date(),
        },
        select: { id: true, email: true, role: true, pharmacyId: true },
      });

      await tx.invite.update({
        where: { code: dto.code },
        data: {
          status: InviteStatus.ACCEPTED,
          acceptedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          pharmacyId: invite.pharmacyId,
          userId: created.id,
          action: 'CREATE',
          entity: 'User',
          entityId: created.id,
          metadata: { source: 'invite', inviteId: invite.id, role: invite.role },
        },
      });

      return created;
    });

    return {
      user,
      accessToken: this.jwtService.sign({ sub: user.id, pharmacyId: user.pharmacyId }),
    };
  }

  async requestEmailVerification(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, pharmacyId: true, emailVerifiedAt: true },
    });

    if (!user) {
      return { message: 'If the account exists, a verification email has been sent.' };
    }

    if (user.emailVerifiedAt) {
      return { message: 'Email is already verified.' };
    }

    const token = await this.prisma.$transaction(async (tx) => {
      await tx.authToken.deleteMany({
        where: {
          userId: user.id,
          type: AuthTokenType.EMAIL_VERIFICATION,
          usedAt: null,
        },
      });

      const created = await tx.authToken.create({
        data: {
          userId: user.id,
          email: user.email,
          type: AuthTokenType.EMAIL_VERIFICATION,
          code: randomUUID(),
          expiresAt: addHours(new Date(), 24),
        },
      });

      return created;
    });

    const verifyUrl = this.buildEmailVerificationUrl(token.code);
    const emailResult = await this.mailerService.sendVerificationEmail({
      to: user.email,
      pharmacyName: await this.getPharmacyName(user.pharmacyId),
      verifyUrl,
    });

    return {
      message: 'If the account exists, a verification email has been sent.',
      emailResult,
    };
  }

  async verifyEmail(code: string) {
    const token = await this.prisma.authToken.findUnique({
      where: { code },
    });

    if (!token || token.type !== AuthTokenType.EMAIL_VERIFICATION) {
      throw new BadRequestException('Verification token not found');
    }

    if (token.usedAt) {
      throw new BadRequestException('Verification token already used');
    }

    if (token.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Verification token expired');
    }

    const user = await this.prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: token.userId },
        data: { emailVerifiedAt: new Date() },
        select: { id: true, email: true, role: true, pharmacyId: true, emailVerifiedAt: true },
      });

      await tx.authToken.update({
        where: { code },
        data: { usedAt: new Date() },
      });

      return updatedUser;
    });

    return {
      message: 'Email verified successfully.',
      user,
    };
  }

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, pharmacyId: true },
    });

    if (!user) {
      return { message: 'If the account exists, a password reset email has been sent.' };
    }

    const token = await this.prisma.$transaction(async (tx) => {
      await tx.authToken.deleteMany({
        where: {
          userId: user.id,
          type: AuthTokenType.PASSWORD_RESET,
          usedAt: null,
        },
      });

      return tx.authToken.create({
        data: {
          userId: user.id,
          email: user.email,
          type: AuthTokenType.PASSWORD_RESET,
          code: randomUUID(),
          expiresAt: addHours(new Date(), 1),
        },
      });
    });

    const resetUrl = this.buildPasswordResetUrl(token.code);
    const emailResult = await this.mailerService.sendPasswordResetEmail({
      to: user.email,
      pharmacyName: await this.getPharmacyName(user.pharmacyId),
      resetUrl,
    });

    return {
      message: 'If the account exists, a password reset email has been sent.',
      emailResult,
    };
  }

  async resetPassword(code: string, password: string) {
    const token = await this.prisma.authToken.findUnique({
      where: { code },
    });

    if (!token || token.type !== AuthTokenType.PASSWORD_RESET) {
      throw new BadRequestException('Password reset token not found');
    }

    if (token.usedAt) {
      throw new BadRequestException('Password reset token already used');
    }

    if (token.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Password reset token expired');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: token.userId },
        data: { password: hashedPassword },
      });

      await tx.authToken.update({
        where: { code },
        data: { usedAt: new Date() },
      });
    });

    return { message: 'Password reset successfully.' };
  }

  private buildInviteAcceptUrl(code: string) {
    return `${buildAppBaseUrl()}/accept-invite?code=${encodeURIComponent(code)}`;
  }

  private buildEmailVerificationUrl(code: string) {
    return `${buildAppBaseUrl()}/verify-email?code=${encodeURIComponent(code)}`;
  }

  private buildPasswordResetUrl(code: string) {
    return `${buildAppBaseUrl()}/reset-password?code=${encodeURIComponent(code)}`;
  }

  private async getPharmacyName(pharmacyId: string) {
    const pharmacy = await this.prisma.pharmacy.findUnique({
      where: { id: pharmacyId },
      select: { name: true },
    });

    return pharmacy?.name ?? 'your pharmacy';
  }

  private async expireStaleInvites(pharmacyId: string) {
    await this.prisma.invite.updateMany({
      where: {
        pharmacyId,
        status: InviteStatus.PENDING,
        expiresAt: {
          lt: new Date(),
        },
      },
      data: {
        status: InviteStatus.EXPIRED,
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
