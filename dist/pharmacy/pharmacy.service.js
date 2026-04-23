"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PharmacyService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const prisma_service_1 = require("../database/prisma.service");
const mailer_service_1 = require("../common/mailer/mailer.service");
let PharmacyService = class PharmacyService {
    prisma;
    mailerService;
    constructor(prisma, mailerService) {
        this.prisma = prisma;
        this.mailerService = mailerService;
    }
    async onboardPharmacy(dto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.adminEmail },
        });
        if (existingUser) {
            throw new common_1.BadRequestException('Admin email already exists');
        }
        const result = await this.prisma.$transaction(async (tx) => {
            const pharmacy = await tx.pharmacy.create({
                data: {
                    name: dto.name,
                    phone: dto.phone,
                    plan: dto.plan ?? client_1.Plan.BASIC,
                    users: {
                        create: {
                            email: dto.adminEmail,
                            password: await bcrypt.hash(dto.password, 10),
                            role: client_1.Role.ADMIN,
                            emailVerifiedAt: new Date(),
                        },
                    },
                    subscriptions: {
                        create: {
                            plan: dto.plan ?? client_1.Plan.BASIC,
                            status: client_1.SubscriptionStatus.ACTIVE,
                            expiresAt: addDays(new Date(), 30),
                        },
                    },
                },
                include: {
                    users: {
                        select: {
                            id: true,
                            email: true,
                            role: true,
                            pharmacyId: true,
                            emailVerifiedAt: true,
                            createdAt: true,
                            updatedAt: true,
                        },
                    },
                    subscriptions: true,
                },
            });
            const adminUser = pharmacy.users[0];
            await tx.auditLog.create({
                data: {
                    pharmacyId: pharmacy.id,
                    userId: adminUser.id,
                    action: 'CREATE',
                    entity: 'Pharmacy',
                    entityId: pharmacy.id,
                    metadata: { plan: pharmacy.plan, status: 'ONBOARDED' },
                },
            });
            return { pharmacy, adminUser };
        });
        return result.pharmacy;
    }
    findOne(pharmacyId) {
        return this.prisma.pharmacy.findUnique({
            where: { id: pharmacyId },
            include: {
                users: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                        pharmacyId: true,
                        emailVerifiedAt: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
                subscriptions: true,
            },
        });
    }
    async update(pharmacyId, dto) {
        return this.prisma.pharmacy.update({
            where: { id: pharmacyId },
            data: {
                name: dto.name,
                phone: dto.phone,
            },
        });
    }
};
exports.PharmacyService = PharmacyService;
exports.PharmacyService = PharmacyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mailer_service_1.MailerService])
], PharmacyService);
function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}
function addHours(date, hours) {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
}
function buildAppBaseUrl() {
    return (process.env.APP_URL ??
        process.env.FRONTEND_URL ??
        'http://127.0.0.1:3000').replace(/\/$/, '');
}
//# sourceMappingURL=pharmacy.service.js.map