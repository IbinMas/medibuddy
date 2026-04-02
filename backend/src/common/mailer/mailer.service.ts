import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';

type InviteMail = {
  to: string;
  pharmacyName: string;
  role: string;
  acceptUrl: string;
};

type VerificationMail = {
  to: string;
  pharmacyName: string;
  verifyUrl: string;
};

type PasswordResetMail = {
  to: string;
  pharmacyName: string;
  resetUrl: string;
};

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly transporter: Transporter | null;
  private readonly fromAddress: string;

  constructor() {
    this.fromAddress = process.env.MAIL_FROM ?? 'no-reply@medibuddy.local';

    const host = process.env.SMTP_HOST;
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth:
          process.env.SMTP_USER && process.env.SMTP_PASS
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

  async sendInviteEmail(mail: InviteMail) {
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
      this.logger.log(
        `SMTP not configured. Invite email preview for ${mail.to}: ${mail.acceptUrl}`,
      );
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

  async sendVerificationEmail(mail: VerificationMail) {
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

  async sendPasswordResetEmail(mail: PasswordResetMail) {
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

  private async sendWithFallback(
    to: string,
    subject: string,
    text: string,
    html: string,
    url: string,
  ) {
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
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
