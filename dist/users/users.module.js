"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersModule = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const users_controller_1 = require("./users.controller");
const mail_module_1 = require("../mail/mail.module");
const transactions_module_1 = require("../transactions/transactions.module");
const grille_tarifaire_module_1 = require("../grille-tarifaire/grille-tarifaire.module");
const compte_systeme_module_1 = require("../compte-systeme/compte-systeme.module");
const commissionnement_module_1 = require("../commissionnement/commissionnement.module");
let UsersModule = class UsersModule {
};
exports.UsersModule = UsersModule;
exports.UsersModule = UsersModule = __decorate([
    (0, common_1.Module)({
        imports: [mail_module_1.MailModule, (0, common_1.forwardRef)(() => transactions_module_1.TransactionsModule), (0, common_1.forwardRef)(() => grille_tarifaire_module_1.GrilleTarifaireModule), (0, common_1.forwardRef)(() => compte_systeme_module_1.CompteSystemeModule), (0, common_1.forwardRef)(() => commissionnement_module_1.CommissionnementModule),],
        providers: [users_service_1.UsersService],
        controllers: [users_controller_1.UsersController],
        exports: [users_service_1.UsersService],
    })
], UsersModule);
//# sourceMappingURL=users.module.js.map