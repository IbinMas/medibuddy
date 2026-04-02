"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ReminderQueueService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderQueueService = void 0;
const common_1 = require("@nestjs/common");
let ReminderQueueService = ReminderQueueService_1 = class ReminderQueueService {
    logger = new common_1.Logger(ReminderQueueService_1.name);
    scheduleReminder(payload) {
        this.logger.log(`Reminder scheduled in no-op mode via [${payload.medium}] for patient ${payload.patientId} and prescription ${payload.prescriptionId}`);
        return {
            queued: false,
            jobName: 'send-reminder',
            payload,
        };
    }
};
exports.ReminderQueueService = ReminderQueueService;
exports.ReminderQueueService = ReminderQueueService = ReminderQueueService_1 = __decorate([
    (0, common_1.Injectable)()
], ReminderQueueService);
//# sourceMappingURL=reminder-queue.service.js.map