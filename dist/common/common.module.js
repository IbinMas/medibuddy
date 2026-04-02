"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../database/prisma.module");
const tenant_guard_1 = require("./guards/tenant.guard");
const roles_guard_1 = require("./guards/roles.guard");
const active_tenant_guard_1 = require("./guards/active-tenant.guard");
const whatsapp_service_1 = require("./whatsapp/whatsapp.service");
const whatsapp_webhook_controller_1 = require("./webhook/whatsapp-webhook.controller");
const sms_service_1 = require("./sms/sms.service");
let CommonModule = class CommonModule {
};
exports.CommonModule = CommonModule;
exports.CommonModule = CommonModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [whatsapp_webhook_controller_1.WhatsappWebhookController],
        providers: [tenant_guard_1.TenantGuard, roles_guard_1.RolesGuard, active_tenant_guard_1.ActiveTenantGuard, whatsapp_service_1.WhatsappService, sms_service_1.SmsService],
        exports: [tenant_guard_1.TenantGuard, roles_guard_1.RolesGuard, active_tenant_guard_1.ActiveTenantGuard, whatsapp_service_1.WhatsappService, sms_service_1.SmsService],
    })
], CommonModule);
//# sourceMappingURL=common.module.js.map