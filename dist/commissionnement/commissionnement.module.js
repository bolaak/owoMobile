"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommissionnementModule = void 0;
const common_1 = require("@nestjs/common");
const commissionnement_service_1 = require("./commissionnement.service");
const commissionnement_controller_1 = require("./commissionnement.controller");
let CommissionnementModule = class CommissionnementModule {
};
exports.CommissionnementModule = CommissionnementModule;
exports.CommissionnementModule = CommissionnementModule = __decorate([
    (0, common_1.Module)({
        providers: [commissionnement_service_1.CommissionnementService],
        controllers: [commissionnement_controller_1.CommissionnementController],
        exports: [commissionnement_service_1.CommissionnementService],
    })
], CommissionnementModule);
//# sourceMappingURL=commissionnement.module.js.map