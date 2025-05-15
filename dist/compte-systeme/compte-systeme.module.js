"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompteSystemeModule = void 0;
const common_1 = require("@nestjs/common");
const compte_systeme_service_1 = require("./compte-systeme.service");
const compte_systeme_controller_1 = require("./compte-systeme.controller");
let CompteSystemeModule = class CompteSystemeModule {
};
exports.CompteSystemeModule = CompteSystemeModule;
exports.CompteSystemeModule = CompteSystemeModule = __decorate([
    (0, common_1.Module)({
        providers: [compte_systeme_service_1.CompteSystemeService],
        controllers: [compte_systeme_controller_1.CompteSystemeController],
        exports: [compte_systeme_service_1.CompteSystemeService],
    })
], CompteSystemeModule);
//# sourceMappingURL=compte-systeme.module.js.map