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
exports.GrilleTarifaireController = void 0;
const common_1 = require("@nestjs/common");
const admin_guard_1 = require("../auth/admin.guard");
const grille_tarifaire_service_1 = require("./grille-tarifaire.service");
const create_grille_tarifaire_dto_1 = require("./dto/create-grille-tarifaire.dto");
let GrilleTarifaireController = class GrilleTarifaireController {
    grilleTarifaireService;
    constructor(grilleTarifaireService) {
        this.grilleTarifaireService = grilleTarifaireService;
    }
    async getAllGrilleTarifaire() {
        return this.grilleTarifaireService.getAllGrilleTarifaire();
    }
    async getGrilleTarifaireById(id) {
        return this.grilleTarifaireService.getGrilleTarifaireById(id);
    }
    async createGrilleTarifaire(grilleData) {
        return this.grilleTarifaireService.createGrilleTarifaire(grilleData);
    }
    async updateGrilleTarifaire(id, updatedData) {
        return this.grilleTarifaireService.updateGrilleTarifaire(id, updatedData);
    }
    async deleteGrilleTarifaire(id) {
        return this.grilleTarifaireService.deleteGrilleTarifaire(id);
    }
    async getGrilleTarifaireByCountryId(paysId) {
        return this.grilleTarifaireService.getGrilleTarifaireByCountryId(paysId);
    }
};
exports.GrilleTarifaireController = GrilleTarifaireController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GrilleTarifaireController.prototype, "getAllGrilleTarifaire", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GrilleTarifaireController.prototype, "getGrilleTarifaireById", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    (0, common_1.UsePipes)(new common_1.ValidationPipe()),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_grille_tarifaire_dto_1.CreateGrilleTarifaireDto]),
    __metadata("design:returntype", Promise)
], GrilleTarifaireController.prototype, "createGrilleTarifaire", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], GrilleTarifaireController.prototype, "updateGrilleTarifaire", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GrilleTarifaireController.prototype, "deleteGrilleTarifaire", null);
__decorate([
    (0, common_1.Get)('pays/:paysId'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __param(0, (0, common_1.Param)('paysId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GrilleTarifaireController.prototype, "getGrilleTarifaireByCountryId", null);
exports.GrilleTarifaireController = GrilleTarifaireController = __decorate([
    (0, common_1.Controller)('grille-tarifaire'),
    __metadata("design:paramtypes", [grille_tarifaire_service_1.GrilleTarifaireService])
], GrilleTarifaireController);
//# sourceMappingURL=grille-tarifaire.controller.js.map