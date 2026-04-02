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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WhatsappWebhookController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappWebhookController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let WhatsappWebhookController = WhatsappWebhookController_1 = class WhatsappWebhookController {
    prisma;
    logger = new common_1.Logger(WhatsappWebhookController_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Verification for Meta WhatsApp Webhook setup.
     * Meta sends a GET request with a hub.verify_token and hub.challenge.
     */
    verify(mode, token, challenge) {
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
    async handle(body) {
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
                                        data: { deliveryStatus: newDbStatus }
                                    });
                                    this.logger.log(`Updated Prescription ${prescriptions[0].id} status to ${newDbStatus}`);
                                }
                            }
                            catch (err) {
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
};
exports.WhatsappWebhookController = WhatsappWebhookController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('hub.mode')),
    __param(1, (0, common_1.Query)('hub.verify_token')),
    __param(2, (0, common_1.Query)('hub.challenge')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], WhatsappWebhookController.prototype, "verify", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WhatsappWebhookController.prototype, "handle", null);
exports.WhatsappWebhookController = WhatsappWebhookController = WhatsappWebhookController_1 = __decorate([
    (0, common_1.Controller)('webhooks/whatsapp'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WhatsappWebhookController);
//# sourceMappingURL=whatsapp-webhook.controller.js.map