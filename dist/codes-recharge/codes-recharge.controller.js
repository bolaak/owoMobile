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
exports.CodesRechargeController = void 0;
const common_1 = require("@nestjs/common");
const admin_guard_1 = require("../auth/admin.guard");
const codes_recharge_service_1 = require("./codes-recharge.service");
const create_code_recharge_dto_1 = require("./dto/create-code-recharge.dto");
let CodesRechargeController = class CodesRechargeController {
    codesRechargeService;
    constructor(codesRechargeService) {
        this.codesRechargeService = codesRechargeService;
    }
    async getAllCodesRecharge() {
        return this.codesRechargeService.getAllCodesRecharge();
    }
    async getCodeRechargeById(id) {
        return this.codesRechargeService.getCodeRechargeById(id);
    }
    async createCodeRecharge(codeData) {
        return this.codesRechargeService.createCodeRecharge(codeData);
    }
    async updateCodeRecharge(id, updatedData) {
        return this.codesRechargeService.updateCodeRecharge(id, updatedData);
    }
    async deleteCodeRecharge(id) {
        return this.codesRechargeService.deleteCodeRecharge(id);
    }
};
exports.CodesRechargeController = CodesRechargeController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CodesRechargeController.prototype, "getAllCodesRecharge", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CodesRechargeController.prototype, "getCodeRechargeById", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    (0, common_1.UsePipes)(new common_1.ValidationPipe()),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_code_recharge_dto_1.CreateCodeRechargeDto]),
    __metadata("design:returntype", Promise)
], CodesRechargeController.prototype, "createCodeRecharge", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CodesRechargeController.prototype, "updateCodeRecharge", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CodesRechargeController.prototype, "deleteCodeRecharge", null);
exports.CodesRechargeController = CodesRechargeController = __decorate([
    (0, common_1.Controller)('codes-recharge'),
    __metadata("design:paramtypes", [codes_recharge_service_1.CodesRechargeService])
], CodesRechargeController);
//# sourceMappingURL=codes-recharge.controller.js.map