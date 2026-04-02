import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { PharmacyModule } from './pharmacy/pharmacy.module';
import { PatientModule } from './patient/patient.module';
import { PrescriptionModule } from './prescription/prescription.module';
import { PaymentModule } from './payment/payment.module';
import { AuditModule } from './audit/audit.module';
import { QueueModule } from './queue/queue.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { HealthModule } from './common/health/health.module';
import { PrismaModule } from './database/prisma.module';
import { MailerModule } from './common/mailer/mailer.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    MailerModule,
    CommonModule,
    AuthModule,
    PharmacyModule,
    PatientModule,
    PrescriptionModule,
    PaymentModule,
    AuditModule,
    DashboardModule,
    HealthModule,
    QueueModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
