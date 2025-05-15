"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientGuard = void 0;
const common_1 = require("@nestjs/common");
const jwt = require("jsonwebtoken");
const config_1 = require("../config");
let ClientGuard = class ClientGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const token = request.headers.authorization?.split(' ')[1];
        console.log('Token reçu :', token);
        if (!token) {
            throw new Error('Token manquant.');
        }
        try {
            const decoded = jwt.verify(token, config_1.Config.JWT_SECRET);
            console.log('Utilisateur décodé :', decoded);
            request.user = decoded;
            if (decoded.type_utilisateur !== 'CLIENT') {
                console.log('Rôle de l\'utilisateur :', decoded.type_utilisateur);
                throw new Error('Accès non autorisé.');
            }
            return true;
        }
        catch (error) {
            console.error('Erreur lors de la vérification du token :', error);
            throw new Error('Token invalide.');
        }
    }
};
exports.ClientGuard = ClientGuard;
exports.ClientGuard = ClientGuard = __decorate([
    (0, common_1.Injectable)()
], ClientGuard);
//# sourceMappingURL=client.guard.js.map