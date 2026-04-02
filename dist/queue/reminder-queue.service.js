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
const bullmq_1 = require("bullmq");
let ReminderQueueService = class ReminderQueueService {
    static { ReminderQueueService_1 = this; }
    logger = new common_1.Logger(ReminderQueueService_1.name);
    reminderQueue = null;
    static redisAvailable = false;
    async onModuleInit() {
        const host = process.env.REDIS_HOST || 'localhost';
        const port = parseInt(process.env.REDIS_PORT || '6379');
        // Quick TCP check before initializing BullMQ
        const canConnect = await this.checkRedis(host, port);
        if (!canConnect) {
            this.logger.warn(`⚠️  Redis not reachable at ${host}:${port}. ` +
                `Reminder scheduling is in SIMULATION MODE. ` +
                `Run "sudo apt install redis -y && redis-server &" to enable live scheduling.`);
            ReminderQueueService_1.redisAvailable = false;
            return;
        }
        this.reminderQueue = new bullmq_1.Queue('reminder-queue', {
            connection: { host, port },
        });
        ReminderQueueService_1.redisAvailable = true;
        this.logger.log('✅ Reminder queue connected to Redis. Live scheduling enabled.');
    }
    async scheduleReminder(payload) {
        if (!ReminderQueueService_1.redisAvailable || !this.reminderQueue) {
            this.logger.log(`[Simulation] Reminder for patient ${payload.patientId} at ${payload.scheduledAt} via [${payload.medium}]`);
            return { queued: false, mode: 'simulation', scheduledAt: payload.scheduledAt };
        }
        const delay = Math.max(0, new Date(payload.scheduledAt).getTime() - Date.now());
        const job = await this.reminderQueue.add('send-reminder', payload, {
            delay,
            removeOnComplete: true,
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
        });
        this.logger.log(`Queued reminder for patient ${payload.patientId} in ${Math.round(delay / 60000)} min (Job ${job.id})`);
        return { queued: true, jobId: job.id, scheduledAt: payload.scheduledAt };
    }
    /** Lightweight TCP check — does NOT create persistent connections */
    checkRedis(host, port) {
        return new Promise((resolve) => {
            const net = require('net');
            const socket = new net.Socket();
            const timeout = 1000;
            socket.setTimeout(timeout);
            socket.on('connect', () => { socket.destroy(); resolve(true); });
            socket.on('timeout', () => { socket.destroy(); resolve(false); });
            socket.on('error', () => { socket.destroy(); resolve(false); });
            socket.connect(port, host);
        });
    }
};
exports.ReminderQueueService = ReminderQueueService;
exports.ReminderQueueService = ReminderQueueService = ReminderQueueService_1 = __decorate([
    (0, common_1.Injectable)()
], ReminderQueueService);
//# sourceMappingURL=reminder-queue.service.js.map