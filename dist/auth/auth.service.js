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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const users_service_1 = require("../users/users.service");
const config_1 = require("../config");
let AuthService = class AuthService {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    async login(numero_compte, mot_de_passe) {
        const user = await this.usersService.getUserByNumeroCompte(numero_compte);
        await this.usersService.checkCountryStatusForUser(user.id);
        await this.usersService.checkUserStatus(numero_compte);
        const isPasswordValid = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
        if (!isPasswordValid) {
            await this.usersService.incrementFailedAttempts(numero_compte);
            throw new Error('Mot de passe incorrect.');
        }
        await this.usersService.resetFailedAttempts(numero_compte);
        const token = jwt.sign({ id: user.id, email: user.email, type_utilisateur: user.type_utilisateur, pass: user.mot_de_passe }, config_1.Config.JWT_SECRET, { expiresIn: '1h' });
        return { token };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], AuthService);
//# sourceMappingURL=auth.service.js.map