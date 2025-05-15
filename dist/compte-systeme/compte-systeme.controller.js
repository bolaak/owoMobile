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
exports.CompteSystemeController = void 0;
const common_1 = require("@nestjs/common");
const admin_guard_1 = require("../auth/admin.guard");
const compte_systeme_service_1 = require("./compte-systeme.service");
const create_compte_systeme_dto_1 = require("./dto/create-compte-systeme.dto");
let CompteSystemeController = class CompteSystemeController {
    compteSystemeService;
    constructor(compteSystemeService) {
        this.compteSystemeService = compteSystemeService;
    }
    async getAllComptesSysteme() {
        return this.compteSystemeService.getAllComptesSysteme();
    }
    async getCompteSystemeById(id) {
        return this.compteSystemeService.getCompteSystemeById(id);
    }
    async createCompteSysteme(compteData) {
        return this.compteSystemeService.createCompteSysteme(compteData);
    }
    async updateCompteSysteme(id, updatedData) {
        return this.compteSystemeService.updateCompteSysteme(id, updatedData);
    }
    async deleteCompteSysteme(id) {
        return this.compteSystemeService.deleteCompteSysteme(id);
    }
};
exports.CompteSystemeController = CompteSystemeController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CompteSystemeController.prototype, "getAllComptesSysteme", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CompteSystemeController.prototype, "getCompteSystemeById", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    (0, common_1.UsePipes)(new common_1.ValidationPipe()),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_compte_systeme_dto_1.CreateCompteSystemeDto]),
    __metadata("design:returntype", Promise)
], CompteSystemeController.prototype, "createCompteSysteme", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CompteSystemeController.prototype, "updateCompteSysteme", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CompteSystemeController.prototype, "deleteCompteSysteme", null);
exports.CompteSystemeController = CompteSystemeController = __decorate([
    (0, common_1.Controller)('compte-systeme'),
    __metadata("design:paramtypes", [compte_systeme_service_1.CompteSystemeService])
], CompteSystemeController);
//# sourceMappingURL=compte-systeme.controller.js.map