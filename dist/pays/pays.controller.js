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
exports.PaysController = void 0;
const common_1 = require("@nestjs/common");
const pays_service_1 = require("./pays.service");
const create_pays_dto_1 = require("./dto/create-pays.dto");
const admin_guard_1 = require("../auth/admin.guard");
let PaysController = class PaysController {
    paysService;
    constructor(paysService) {
        this.paysService = paysService;
    }
    async getAllPays() {
        return this.paysService.getAllPays();
    }
    async getPaysById(id) {
        return this.paysService.getPaysById(id);
    }
    async createPays(paysData) {
        return this.paysService.createPays(paysData);
    }
    async updatePays(id, updatedData) {
        return this.paysService.updatePays(id, updatedData);
    }
    async deletePays(id) {
        return this.paysService.deletePays(id);
    }
    async activatePays(id) {
        return this.paysService.updatePaysStatus(id, 'Activated');
    }
    async deactivatePays(id) {
        return this.paysService.updatePaysStatus(id, 'Deactivated');
    }
    async suspendPays(id) {
        return this.paysService.updatePaysStatus(id, 'Suspended');
    }
};
exports.PaysController = PaysController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PaysController.prototype, "getAllPays", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaysController.prototype, "getPaysById", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    (0, common_1.UsePipes)(new common_1.ValidationPipe()),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_pays_dto_1.CreatePaysDto]),
    __metadata("design:returntype", Promise)
], PaysController.prototype, "createPays", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PaysController.prototype, "updatePays", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaysController.prototype, "deletePays", null);
__decorate([
    (0, common_1.Put)(':id/activate'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaysController.prototype, "activatePays", null);
__decorate([
    (0, common_1.Put)(':id/deactivate'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaysController.prototype, "deactivatePays", null);
__decorate([
    (0, common_1.Put)(':id/suspend'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaysController.prototype, "suspendPays", null);
exports.PaysController = PaysController = __decorate([
    (0, common_1.Controller)('pays'),
    __metadata("design:paramtypes", [pays_service_1.PaysService])
], PaysController);
//# sourceMappingURL=pays.controller.js.map