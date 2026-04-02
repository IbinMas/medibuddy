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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrescriptionController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const active_tenant_guard_1 = require("../common/guards/active-tenant.guard");
const create_prescription_dto_1 = require("./dto/create-prescription.dto");
const prescription_service_1 = require("./prescription.service");
const pagination_dto_1 = require("../common/dto/pagination.dto");
let PrescriptionController = class PrescriptionController {
    prescriptionService;
    constructor(prescriptionService) {
        this.prescriptionService = prescriptionService;
    }
    create(req, dto) {
        return this.prescriptionService.create(req.pharmacyId ?? req.user.pharmacyId, req.user.id, dto);
    }
    bulkCreate(req, dtos) {
        return this.prescriptionService.bulkCreate(req.pharmacyId ?? req.user.pharmacyId, req.user.id, dtos);
    }
    findAll(req, query) {
        return this.prescriptionService.findAll(req.pharmacyId ?? req.user.pharmacyId, query.page ?? 1, query.limit ?? 20, query.search);
    }
    history(req, patientId) {
        return this.prescriptionService.history(patientId, req.pharmacyId ?? req.user.pharmacyId);
    }
};
exports.PrescriptionController = PrescriptionController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_prescription_dto_1.CreatePrescriptionDto]),
    __metadata("design:returntype", void 0)
], PrescriptionController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('bulk'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Array]),
    __metadata("design:returntype", void 0)
], PrescriptionController.prototype, "bulkCreate", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, pagination_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", void 0)
], PrescriptionController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('patient/:patientId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('patientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PrescriptionController.prototype, "history", null);
exports.PrescriptionController = PrescriptionController = __decorate([
    (0, common_1.Controller)('prescriptions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, active_tenant_guard_1.ActiveTenantGuard),
    __metadata("design:paramtypes", [prescription_service_1.PrescriptionService])
], PrescriptionController);
//# sourceMappingURL=prescription.controller.js.map