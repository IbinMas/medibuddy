"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyTenantWhere = applyTenantWhere;
function applyTenantWhere(where, pharmacyId) {
    return {
        ...where,
        pharmacyId,
    };
}
//# sourceMappingURL=tenant.utils.js.map