"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const auth_module_1 = require("./auth/auth.module");
const pharmacy_module_1 = require("./pharmacy/pharmacy.module");
const patient_module_1 = require("./patient/patient.module");
const prescription_module_1 = require("./prescription/prescription.module");
const payment_module_1 = require("./payment/payment.module");
const audit_module_1 = require("./audit/audit.module");
const queue_module_1 = require("./queue/queue.module");
const analytics_module_1 = require("./analytics/analytics.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const health_module_1 = require("./common/health/health.module");
const prisma_module_1 = require("./database/prisma.module");
const mailer_module_1 = require("./common/mailer/mailer.module");
const common_module_1 = require("./common/common.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            schedule_1.ScheduleModule.forRoot(),
            prisma_module_1.PrismaModule,
            mailer_module_1.MailerModule,
            common_module_1.CommonModule,
            auth_module_1.AuthModule,
            pharmacy_module_1.PharmacyModule,
            patient_module_1.PatientModule,
            prescription_module_1.PrescriptionModule,
            payment_module_1.PaymentModule,
            audit_module_1.AuditModule,
            dashboard_module_1.DashboardModule,
            health_module_1.HealthModule,
            queue_module_1.QueueModule,
            analytics_module_1.AnalyticsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map