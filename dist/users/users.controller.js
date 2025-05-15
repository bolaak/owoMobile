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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const create_user_dto_1 = require("./dto/create-user.dto");
const admin_guard_1 = require("../auth/admin.guard");
const auth_guard_1 = require("../auth/auth.guard");
const recover_password_dto_1 = require("./dto/recover-password.dto");
const change_password_dto_1 = require("./dto/change-password.dto");
const user_decorator_1 = require("../decorators/user.decorator");
let UsersController = class UsersController {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    async getAllUsers() {
        return this.usersService.getAllUsers();
    }
    async createUser(userData) {
        return this.usersService.createUser(userData);
    }
    async getUserById(id) {
        return this.usersService.getUserById(id);
    }
    async getUserByNumeroCompte(numero_compte) {
        return this.usersService.getUserByNumeroCompte(numero_compte);
    }
    async updateUser(id, updatedData) {
        return this.usersService.updateUser(id, updatedData);
    }
    async deleteUser(id) {
        return this.usersService.deleteUser(id);
    }
    async recoverPIN(body) {
        const { numero_compte } = body;
        if (!numero_compte) {
            throw new Error('Le numéro de compte est requis.');
        }
        return this.usersService.sendPINToUser(numero_compte);
    }
    async unlockUser(body) {
        const { numero_compte } = body;
        if (!numero_compte) {
            throw new Error('Le numéro de compte est requis.');
        }
        return this.usersService.unlockUser(numero_compte);
    }
    async blockUser(body) {
        const { numero_compte } = body;
        if (!numero_compte) {
            throw new Error('Le numéro de compte est requis.');
        }
        await this.usersService.blockUser(numero_compte);
        return { message: 'Le compte a été bloqué avec succès.' };
    }
    async recoverPassword(body) {
        const { numero_compte } = body;
        return this.usersService.sendPasswordToUser(numero_compte);
    }
    async changePassword(user, body) {
        console.log('Utilisateur récupéré dans le contrôleur :', user);
        const { oldPassword, newPassword } = body;
        await this.usersService.changePassword(user.id, oldPassword, newPassword);
        return { message: 'Le mot de passe a été changé avec succès.' };
    }
    async getMarchandsByMasterId(masterId) {
        return this.usersService.getMarchandsByMasterId(masterId);
    }
    async getMasterByMarchand(marchandId) {
        return this.usersService.getMasterByMarchand(marchandId);
    }
    async getAllMasters() {
        return this.usersService.getAllMasters();
    }
    async consulterSolde(soldeData) {
        const { numero_compte, pin } = soldeData;
        try {
            console.log('Données reçues pour la consultation du solde :', soldeData);
            console.log('Récupération des données de l\'utilisateur...');
            const userRecord = await this.usersService.getUserByNumeroCompte(numero_compte);
            console.log('Utilisateur trouvé :', userRecord);
            console.log('Vérification du statut de l\'utilsateur...');
            await this.usersService.checkCountryStatusForUser(userRecord.id);
            console.log('Vérification du statut de l\'utilsateur...');
            await this.usersService.checkUserStatus(numero_compte);
            console.log('Validation du code PIN...');
            await this.usersService.validatePIN(numero_compte, pin);
            const deviseCode = userRecord.devise_code || 'X0F';
            const solde = userRecord.solde || 0;
            console.log(`Solde consulté pour le numéro de compte : ${numero_compte}, Solde : ${solde} ${deviseCode}`);
            return { message: 'Consultation du solde réussie.', solde, deviseCode };
        }
        catch (error) {
            console.error('Erreur lors de la consultation du solde :', error.message);
            throw new Error(`Erreur lors de la consultation du solde : ${error.message}`);
        }
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getAllUsers", null);
__decorate([
    (0, common_1.Post)('register'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe()),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_dto_1.CreateUserDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "createUser", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getUserById", null);
__decorate([
    (0, common_1.Get)('numero/:numero_compte'),
    __param(0, (0, common_1.Param)('numero_compte')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getUserByNumeroCompte", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "deleteUser", null);
__decorate([
    (0, common_1.Post)('recover-pin'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "recoverPIN", null);
__decorate([
    (0, common_1.Post)('unlock'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "unlockUser", null);
__decorate([
    (0, common_1.Post)('block'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "blockUser", null);
__decorate([
    (0, common_1.Post)('recover-password'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe()),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [recover_password_dto_1.RecoverPasswordDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "recoverPassword", null);
__decorate([
    (0, common_1.Post)('change-password'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.UsePipes)(new common_1.ValidationPipe()),
    __param(0, (0, user_decorator_1.User)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, change_password_dto_1.ChangePasswordDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Get)('masters/:masterId'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __param(0, (0, common_1.Param)('masterId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getMarchandsByMasterId", null);
__decorate([
    (0, common_1.Get)('marchand/:marchandId'),
    __param(0, (0, common_1.Param)('marchandId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getMasterByMarchand", null);
__decorate([
    (0, common_1.Get)('list-masters'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getAllMasters", null);
__decorate([
    (0, common_1.Post)('consulter-solde'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "consulterSolde", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map