"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const users_module_1 = require("./users/users.module");
const mail_module_1 = require("./mail/mail.module");
const auth_module_1 = require("./auth/auth.module");
const pays_module_1 = require("./pays/pays.module");
const grille_tarifaire_module_1 = require("./grille-tarifaire/grille-tarifaire.module");
const compte_systeme_module_1 = require("./compte-systeme/compte-systeme.module");
const commissionnement_module_1 = require("./commissionnement/commissionnement.module");
const codes_recharge_module_1 = require("./codes-recharge/codes-recharge.module");
const transactions_module_1 = require("./transactions/transactions.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [users_module_1.UsersModule, mail_module_1.MailModule, auth_module_1.AuthModule, pays_module_1.PaysModule, grille_tarifaire_module_1.GrilleTarifaireModule, compte_systeme_module_1.CompteSystemeModule, commissionnement_module_1.CommissionnementModule, codes_recharge_module_1.CodesRechargeModule, transactions_module_1.TransactionsModule],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map