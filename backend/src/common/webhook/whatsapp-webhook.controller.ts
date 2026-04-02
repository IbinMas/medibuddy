import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Controller('webhooks/whatsapp')
export class WhatsappWebhookController {
  private readonly logger = new Logger(WhatsappWebhookController.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Verification for Meta WhatsApp Webhook setup.
   * Meta sends a GET request with a hub.verify_token and hub.challenge.
   */
  @Get()
  verify(@Query('hub.mode') mode: string, @Query('hub.verify_token') token: string, @Query('hub.challenge') challenge: string) {
    if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
      this.logger.log('WhatsApp Webhook Verified successfully');
      return challenge;
    }
    this.logger.error('WhatsApp Webhook verification failed: Invalid verify token');
    return 'Verification failed';
  }

  /**
   * Handling incoming WhatsApp callbacks (status updates: sent, delivered, read, failed).
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async handle(@Body() body: any) {
    // Meta sends multiple updates in one request sometimes
    if (body.object === 'whatsapp_business_account' && body.entry) {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.value.statuses) {
            for (const status of change.value.statuses) {
              const messageId = status.id;
              const deliveryStatus = status.status; // sent, delivered, read, failed
              const recipient = status.recipient_id;
              
              this.logger.log(`[WhatsApp Delivery] MsgId: ${messageId} | To: ${recipient} | Status: ${deliveryStatus}`);
              
              const newDbStatus = (deliveryStatus === 'failed') ? 'FAILED' : 'DELIVERED';

              try {
                // Find and update the prescription matching this messageId
                const prescriptions = await this.prisma.prescription.findMany({
                  where: { messageId }
                });

                if (prescriptions.length > 0) {
                  await this.prisma.prescription.update({
                    where: { id: prescriptions[0].id },
                    data: { deliveryStatus: newDbStatus as any }
                  });
                  this.logger.log(`Updated Prescription ${prescriptions[0].id} status to ${newDbStatus}`);
                }

              } catch (err) {
                this.logger.error(`Failed to update DB for WhatsApp msg ${messageId}`, err);
              }

              if (deliveryStatus === 'failed') {
                this.logger.error(`WhatsApp Delivery FAILED to ${recipient}. Error: ${JSON.stringify(status.errors)}`);
              }
            }
          }
        }
      }
    }
    
    // Always return 200 OK to Meta
    return { success: true };
  }
}
