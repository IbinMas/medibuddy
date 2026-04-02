"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var MailerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailerService = void 0;
const common_1 = require("@nestjs/common");
const nodemailer_1 = __importDefault(require("nodemailer"));
let MailerService = MailerService_1 = class MailerService {
    logger = new common_1.Logger(MailerService_1.name);
    transporter;
    fromAddress;
    constructor() {
        this.fromAddress = process.env.MAIL_FROM ?? 'no-reply@medibuddy.local';
        const host = process.env.SMTP_HOST;
        if (host) {
            this.transporter = nodemailer_1.default.createTransport({
                host,
                port: Number(process.env.SMTP_PORT ?? 587),
                secure: process.env.SMTP_SECURE === 'true',
                auth: process.env.SMTP_USER && process.env.SMTP_PASS
                    ? {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS,
                    }
                    : undefined,
            });
            return;
        }
        this.transporter = null;
    }
    async sendInviteEmail(mail) {
        const subject = `You're invited to join ${mail.pharmacyName}`;
        const text = [
            `You have been invited to join ${mail.pharmacyName} on MediBuddy.`,
            `Role: ${mail.role}`,
            `Accept your invite here: ${mail.acceptUrl}`,
            `This link is intended for the invited email address only.`,
        ].join('\n\n');
        const html = `
      <p>You have been invited to join <strong>${escapeHtml(mail.pharmacyName)}</strong> on MediBuddy.</p>
      <p>Role: <strong>${escapeHtml(mail.role)}</strong></p>
      <p><a href="${escapeHtml(mail.acceptUrl)}">Accept invitation</a></p>
      <p>This link is intended for the invited email address only.</p>
    `;
        if (!this.transporter) {
            this.logger.log(`SMTP not configured. Invite email preview for ${mail.to}: ${mail.acceptUrl}`);
            return {
                sent: false,
                preview: { to: mail.to, subject, text, html, acceptUrl: mail.acceptUrl },
            };
        }
        const info = await this.transporter.sendMail({
            from: this.fromAddress,
            to: mail.to,
            subject,
            text,
            html,
        });
        this.logger.log(`Invite email sent to ${mail.to}`);
        return {
            sent: true,
            messageId: info.messageId,
            response: info.response,
        };
    }
    async sendVerificationEmail(mail) {
        const subject = `Verify your MediBuddy email`;
        const text = [
            `Please verify your email for ${mail.pharmacyName}.`,
            `Verify here: ${mail.verifyUrl}`,
            `If you did not request this, you can ignore this email.`,
        ].join('\n\n');
        const html = `
      <p>Please verify your email for <strong>${escapeHtml(mail.pharmacyName)}</strong>.</p>
      <p><a href="${escapeHtml(mail.verifyUrl)}">Verify email</a></p>
      <p>If you did not request this, you can ignore this email.</p>
    `;
        return this.sendWithFallback(mail.to, subject, text, html, mail.verifyUrl);
    }
    async sendPasswordResetEmail(mail) {
        const subject = `Reset your MediBuddy password`;
        const text = [
            `You requested a password reset for ${mail.pharmacyName}.`,
            `Reset here: ${mail.resetUrl}`,
            `If you did not request this, you can ignore this email.`,
        ].join('\n\n');
        const html = `
      <p>You requested a password reset for <strong>${escapeHtml(mail.pharmacyName)}</strong>.</p>
      <p><a href="${escapeHtml(mail.resetUrl)}">Reset password</a></p>
      <p>If you did not request this, you can ignore this email.</p>
    `;
        return this.sendWithFallback(mail.to, subject, text, html, mail.resetUrl);
    }
    async sendWithFallback(to, subject, text, html, url) {
        if (!this.transporter) {
            this.logger.log(`SMTP not configured. Email preview for ${to}: ${url}`);
            return {
                sent: false,
                preview: { to, subject, text, html, url },
            };
        }
        const info = await this.transporter.sendMail({
            from: this.fromAddress,
            to,
            subject,
            text,
            html,
        });
        this.logger.log(`Email sent to ${to}`);
        return {
            sent: true,
            messageId: info.messageId,
            response: info.response,
        };
    }
};
exports.MailerService = MailerService;
exports.MailerService = MailerService = MailerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], MailerService);
function escapeHtml(value) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}
//# sourceMappingURL=mailer.service.js.map