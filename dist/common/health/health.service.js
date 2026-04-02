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
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = __importDefault(require("ioredis"));
const prisma_service_1 = require("../../database/prisma.service");
let HealthService = class HealthService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async check() {
        const db = await this.checkDatabase();
        const redis = await this.checkRedis();
        const smtp = this.checkSmtp();
        return {
            status: db.status === 'ok' && redis.status !== 'down' ? 'ok' : 'degraded',
            database: db,
            redis,
            smtp,
            timestamp: new Date().toISOString(),
        };
    }
    async checkDatabase() {
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            return { status: 'ok' };
        }
        catch (error) {
            return { status: 'down', error: 'database unavailable' };
        }
    }
    async checkRedis() {
        const url = process.env.REDIS_URL;
        if (!url) {
            return { status: 'skipped' };
        }
        const client = new ioredis_1.default(url, { lazyConnect: true, maxRetriesPerRequest: 1 });
        try {
            await client.connect();
            await client.ping();
            return { status: 'ok' };
        }
        catch {
            return { status: 'down', error: 'redis unavailable' };
        }
        finally {
            await client.quit().catch(() => undefined);
        }
    }
    checkSmtp() {
        const configured = Boolean(process.env.SMTP_HOST);
        return {
            status: configured ? 'configured' : 'not_configured',
        };
    }
};
exports.HealthService = HealthService;
exports.HealthService = HealthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HealthService);
//# sourceMappingURL=health.service.js.map