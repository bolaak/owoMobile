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
exports.CommissionnementController = void 0;
const common_1 = require("@nestjs/common");
const admin_guard_1 = require("../auth/admin.guard");
const commissionnement_service_1 = require("./commissionnement.service");
const create_commissionnement_dto_1 = require("./dto/create-commissionnement.dto");
let CommissionnementController = class CommissionnementController {
    commissionnementService;
    constructor(commissionnementService) {
        this.commissionnementService = commissionnementService;
    }
    async getAllCommissionnements() {
        return this.commissionnementService.getAllCommissionnements();
    }
    async getCommissionnementById(id) {
        return this.commissionnementService.getCommissionnementById(id);
    }
    async createCommissionnement(commissionData) {
        return this.commissionnementService.createCommissionnement(commissionData);
    }
    async updateCommissionnement(id, updatedData) {
        return this.commissionnementService.updateCommissionnement(id, updatedData);
    }
    async deleteCommissionnement(id) {
        return this.commissionnementService.deleteCommissionnement(id);
    }
};
exports.CommissionnementController = CommissionnementController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CommissionnementController.prototype, "getAllCommissionnements", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CommissionnementController.prototype, "getCommissionnementById", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    (0, common_1.UsePipes)(new common_1.ValidationPipe()),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_commissionnement_dto_1.CreateCommissionnementDto]),
    __metadata("design:returntype", Promise)
], CommissionnementController.prototype, "createCommissionnement", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CommissionnementController.prototype, "updateCommissionnement", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CommissionnementController.prototype, "deleteCommissionnement", null);
exports.CommissionnementController = CommissionnementController = __decorate([
    (0, common_1.Controller)('commissionnement'),
    __metadata("design:paramtypes", [commissionnement_service_1.CommissionnementService])
], CommissionnementController);
//# sourceMappingURL=commissionnement.controller.js.map