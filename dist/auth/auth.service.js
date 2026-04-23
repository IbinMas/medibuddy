"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const prisma_service_1 = require("../database/prisma.service");
const crypto_1 = require("crypto");
const mailer_service_1 = require("../common/mailer/mailer.service");
let AuthService = class AuthService {
    prisma;
    jwtService;
    mailerService;
    constructor(prisma, jwtService, mailerService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.mailerService = mailerService;
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
            select: {
                id: true,
                email: true,
                password: true,
                role: true,
                pharmacyId: true,
            },
        });
        if (!user || !(await bcrypt.compare(dto.password, user.password))) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        return {
            user: { id: user.id, email: user.email, role: user.role, pharmacyId: user.pharmacyId },
            accessToken: this.jwtService.sign({ sub: user.id, pharmacyId: user.pharmacyId }),
        };
    }
    async getMe(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                role: true,
                pharmacyId: true,
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
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async updateProfile(userId, dto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const data = {};
        if (dto.email && dto.email !== user.email) {
            const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
            if (existing)
                throw new common_1.ConflictException('Email already in use');
            data.email = dto.email;
        }
        if (dto.password) {
            if (!dto.currentPassword) {
                throw new common_1.BadRequestException('Current password required to set new password');
            }
            const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
            if (!isMatch)
                throw new common_1.UnauthorizedException('Invalid current password');
            data.password = await bcrypt.hash(dto.password, 10);
        }
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data,
            select: { id: true, email: true, role: true, pharmacyId: true },
        });
        return updated;
    }
    async createInvite(pharmacyId, createdByUserId, dto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existingUser) {
            throw new common_1.ConflictException('Email already registered');
        }
        const activeInvite = await this.prisma.invite.findFirst({
            where: {
                pharmacyId,
                email: dto.email,
                status: client_1.InviteStatus.PENDING,
            },
        });
        if (activeInvite) {
            throw new common_1.ConflictException('Invite already pending for this email');
        }
        const invite = await this.prisma.$transaction(async (tx) => {
            const created = await tx.invite.create({
                data: {
                    pharmacyId,
                    email: dto.email,
                    role: dto.role,
                    code: (0, crypto_1.randomUUID)(),
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
    async listInvites(pharmacyId) {
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
    async resendInvite(pharmacyId, inviteId, createdByUserId) {
        const invite = await this.prisma.invite.findFirst({
            where: { id: inviteId, pharmacyId },
        });
        if (!invite) {
            throw new common_1.NotFoundException('Invite not found');
        }
        if (invite.status === client_1.InviteStatus.ACCEPTED) {
            throw new common_1.BadRequestException('Accepted invites cannot be resent');
        }
        const updatedInvite = await this.prisma.$transaction(async (tx) => {
            const updated = await tx.invite.update({
                where: { id: invite.id },
                data: {
                    code: (0, crypto_1.randomUUID)(),
                    status: client_1.InviteStatus.PENDING,
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
    async revokeInvite(pharmacyId, inviteId, createdByUserId) {
        const invite = await this.prisma.invite.findFirst({
            where: { id: inviteId, pharmacyId },
        });
        if (!invite) {
            throw new common_1.NotFoundException('Invite not found');
        }
        if (invite.status === client_1.InviteStatus.ACCEPTED) {
            throw new common_1.BadRequestException('Accepted invites cannot be revoked');
        }
        const updated = await this.prisma.$transaction(async (tx) => {
            const revoked = await tx.invite.update({
                where: { id: invite.id },
                data: { status: client_1.InviteStatus.CANCELLED },
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
    async acceptInvite(dto) {
        const invite = await this.prisma.invite.findUnique({
            where: { code: dto.code },
        });
        if (!invite) {
            throw new common_1.BadRequestException('Invite not found');
        }
        if (invite.status !== client_1.InviteStatus.PENDING) {
            throw new common_1.BadRequestException('Invite is no longer active');
        }
        if (invite.expiresAt.getTime() < Date.now()) {
            await this.prisma.invite.update({
                where: { code: dto.code },
                data: { status: client_1.InviteStatus.EXPIRED },
            });
            throw new common_1.BadRequestException('Invite has expired');
        }
        const emailNormalized = invite.email.toLowerCase();
        const existingUser = await this.prisma.user.findUnique({
            where: { email: emailNormalized },
        });
        if (existingUser) {
            throw new common_1.ConflictException('Email already registered');
        }
        const user = await this.prisma.$transaction(async (tx) => {
            const created = await tx.user.create({
                data: {
                    email: emailNormalized,
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
                    status: client_1.InviteStatus.ACCEPTED,
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
    async requestPasswordReset(email) {
        const emailNormalized = email.toLowerCase();
        const user = await this.prisma.user.findUnique({
            where: { email: emailNormalized },
            select: { id: true, email: true, pharmacyId: true },
        });
        if (!user) {
            return { message: 'If the account exists, a password reset email has been sent.' };
        }
        const token = await this.prisma.$transaction(async (tx) => {
            await tx.authToken.deleteMany({
                where: {
                    userId: user.id,
                    type: client_1.AuthTokenType.PASSWORD_RESET,
                    usedAt: null,
                },
            });
            return tx.authToken.create({
                data: {
                    userId: user.id,
                    email: user.email,
                    type: client_1.AuthTokenType.PASSWORD_RESET,
                    code: (0, crypto_1.randomUUID)(),
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
    async resetPassword(code, password) {
        const token = await this.prisma.authToken.findUnique({
            where: { code },
        });
        if (!token || token.type !== client_1.AuthTokenType.PASSWORD_RESET) {
            throw new common_1.BadRequestException('Password reset token not found');
        }
        if (token.usedAt) {
            throw new common_1.BadRequestException('Password reset token already used');
        }
        if (token.expiresAt.getTime() < Date.now()) {
            throw new common_1.BadRequestException('Password reset token expired');
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
    buildInviteAcceptUrl(code) {
        return `${buildAppBaseUrl()}/accept-invite?code=${encodeURIComponent(code)}`;
    }
    buildPasswordResetUrl(code) {
        return `${buildAppBaseUrl()}/reset-password?code=${encodeURIComponent(code)}`;
    }
    async getPharmacyName(pharmacyId) {
        const pharmacy = await this.prisma.pharmacy.findUnique({
            where: { id: pharmacyId },
            select: { name: true },
        });
        return pharmacy?.name ?? 'your pharmacy';
    }
    async expireStaleInvites(pharmacyId) {
        await this.prisma.invite.updateMany({
            where: {
                pharmacyId,
                status: client_1.InviteStatus.PENDING,
                expiresAt: {
                    lt: new Date(),
                },
            },
            data: {
                status: client_1.InviteStatus.EXPIRED,
            },
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        mailer_service_1.MailerService])
], AuthService);
function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}
function addHours(date, hours) {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
}
function buildAppBaseUrl() {
    return (process.env.APP_URL ??
        process.env.FRONTEND_URL ??
        'http://127.0.0.1:3000').replace(/\/$/, '');
}
//# sourceMappingURL=auth.service.js.map