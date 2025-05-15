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
exports.AuditLogService = void 0;
const common_1 = require("@nestjs/common");
const Airtable = require("airtable");
const config_1 = require("../config");
let AuditLogService = class AuditLogService {
    base;
    constructor() {
        if (!config_1.Config.AIRTABLE_API_KEY || !config_1.Config.AIRTABLE_BASE_ID) {
            throw new Error('AIRTABLE_API_KEY or AIRTABLE_BASE_ID is not defined in the environment variables');
        }
        Airtable.configure({ apiKey: config_1.Config.AIRTABLE_API_KEY });
        this.base = Airtable.base(config_1.Config.AIRTABLE_BASE_ID);
    }
    async createLog(userId, operationType, resourceType, resourceId, details) {
        try {
            const timestamp = new Date().toISOString();
            await this.base('AuditLog').create([
                {
                    fields: {
                        user_id: [userId],
                        operation_type: operationType,
                        resource_type: resourceType,
                        resource_id: resourceId,
                        details: JSON.stringify(details),
                        timestamp,
                    },
                },
            ]);
        }
        catch (error) {
            console.error(`Erreur lors de la création du log : ${error.message}`);
        }
    }
    async getAllLogs() {
        const records = await this.base('AuditLog').select().all();
        return records.map((record) => ({ id: record.id, ...record.fields }));
    }
};
exports.AuditLogService = AuditLogService;
exports.AuditLogService = AuditLogService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], AuditLogService);
//# sourceMappingURL=audit-log.service.js.map