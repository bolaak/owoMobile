"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodesRechargeModule = void 0;
const common_1 = require("@nestjs/common");
const codes_recharge_service_1 = require("./codes-recharge.service");
const codes_recharge_controller_1 = require("./codes-recharge.controller");
let CodesRechargeModule = class CodesRechargeModule {
};
exports.CodesRechargeModule = CodesRechargeModule;
exports.CodesRechargeModule = CodesRechargeModule = __decorate([
    (0, common_1.Module)({
        providers: [codes_recharge_service_1.CodesRechargeService],
        controllers: [codes_recharge_controller_1.CodesRechargeController],
        exports: [codes_recharge_service_1.CodesRechargeService],
    })
], CodesRechargeModule);
//# sourceMappingURL=codes-recharge.module.js.map