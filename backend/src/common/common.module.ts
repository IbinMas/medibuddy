import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { TenantGuard } from './guards/tenant.guard';
import { RolesGuard } from './guards/roles.guard';
import { ActiveTenantGuard } from './guards/active-tenant.guard';
import { WhatsappService } from './whatsapp/whatsapp.service';
import { WhatsappWebhookController } from './webhook/whatsapp-webhook.controller';
import { SmsService } from './sms/sms.service';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [WhatsappWebhookController],
  providers: [TenantGuard, RolesGuard, ActiveTenantGuard, WhatsappService, SmsService],
  exports: [TenantGuard, RolesGuard, ActiveTenantGuard, WhatsappService, SmsService],
})
export class CommonModule {}
