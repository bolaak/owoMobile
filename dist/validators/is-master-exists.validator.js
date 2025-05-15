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
exports.IsMasterExists = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const codes_recharge_service_1 = require("../codes-recharge/codes-recharge.service");
let IsMasterExists = class IsMasterExists {
    codesRechargeService;
    constructor(codesRechargeService) {
        this.codesRechargeService = codesRechargeService;
    }
    async validate(masterId, args) {
        try {
            await this.codesRechargeService.validateMasterId(masterId);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    defaultMessage(args) {
        return `Le Master spécifié (ID: ${args.value}) est introuvable ou n'est pas de type MASTER.`;
    }
};
exports.IsMasterExists = IsMasterExists;
exports.IsMasterExists = IsMasterExists = __decorate([
    (0, class_validator_1.ValidatorConstraint)({ name: 'IsMasterExists', async: true }),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [codes_recharge_service_1.CodesRechargeService])
], IsMasterExists);
//# sourceMappingURL=is-master-exists.validator.js.map