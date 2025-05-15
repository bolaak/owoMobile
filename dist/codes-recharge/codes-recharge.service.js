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
exports.CodesRechargeService = void 0;
const common_1 = require("@nestjs/common");
const Airtable = require("airtable");
const config_1 = require("../config");
let CodesRechargeService = class CodesRechargeService {
    base;
    constructor() {
        if (!config_1.Config.AIRTABLE_API_KEY || !config_1.Config.AIRTABLE_BASE_ID) {
            throw new Error('AIRTABLE_API_KEY or AIRTABLE_BASE_ID is not defined in the environment variables');
        }
        Airtable.configure({ apiKey: config_1.Config.AIRTABLE_API_KEY });
        this.base = Airtable.base(config_1.Config.AIRTABLE_BASE_ID);
    }
    async getAllCodesRecharge() {
        const records = await this.base('CodesRecharge').select().all();
        return records.map((record) => ({ id: record.id, ...record.fields }));
    }
    async getCodeRechargeById(id) {
        const records = await this.base('CodesRecharge')
            .select({ filterByFormula: `{id} = '${id}'` })
            .firstPage();
        if (records.length === 0) {
            throw new Error('Code de recharge non trouvé.');
        }
        return { id: records[0].id, ...records[0].fields };
    }
    async createCodeRecharge(codeData) {
        const { montant, master_id } = codeData;
        await this.validateMasterId(master_id);
        const isCountryActivated = await this.isCountryActivated(master_id);
        if (!isCountryActivated) {
            throw new Error('Le pays associé à ce Master n\'est pas activé.');
        }
        const isActivated = await this.isMasterActivated(master_id);
        if (!isActivated) {
            throw new Error('Ce Master n\'est pas activé et ne peut pas recevoir de code de recharge.');
        }
        if (montant < 1000000) {
            throw new Error('Le montant doit être supérieur ou égal à 1 000 000.');
        }
        const hasActiveCode = await this.hasActiveCode(master_id);
        if (hasActiveCode) {
            throw new Error('Ce Master a un code de recharge actif.');
        }
        try {
            const code = Math.floor(1000000000000 + Math.random() * 9000000000000).toString();
            const createdRecords = await this.base('CodesRecharge').create([
                {
                    fields: {
                        montant,
                        master_id: [master_id],
                        code,
                        status: 'Activated',
                    },
                },
            ]);
            return { id: createdRecords[0].id, ...createdRecords[0].fields };
        }
        catch (error) {
            throw new Error(`Erreur lors de la création du code de recharge : ${error.message}`);
        }
    }
    async updateCodeRecharge(id, updatedData) {
        const { master_id } = updatedData;
        if (master_id) {
            await this.validateMasterId(master_id);
        }
        try {
            await this.base('CodesRecharge').update(id, updatedData);
            return { message: 'Code de recharge mis à jour avec succès.' };
        }
        catch (error) {
            throw new Error(`Erreur lors de la mise à jour du code de recharge : ${error.message}`);
        }
    }
    async deleteCodeRecharge(id) {
        try {
            await this.base('CodesRecharge').destroy(id);
            return { message: 'Code de recharge supprimé avec succès.' };
        }
        catch (error) {
            throw new Error(`Erreur lors de la suppression du code de recharge : ${error.message}`);
        }
    }
    async validateMasterId(masterId) {
        const masterRecords = await this.base('Utilisateurs')
            .select({ filterByFormula: `AND({id} = '${masterId}', {type_utilisateur} = 'MASTER')` })
            .firstPage();
        if (masterRecords.length === 0) {
            throw new Error('L\'utilisateur spécifié est introuvable ou n\'est pas de type MASTER.');
        }
    }
    async hasActiveCode(masterId) {
        const records = await this.base('CodesRecharge')
            .select({ filterByFormula: `AND({master_id} = '${masterId}', {status} = 'Activated')` })
            .firstPage();
        return records.length > 0;
    }
    async isMasterActivated(masterId) {
        const masterRecords = await this.base('Utilisateurs')
            .select({ filterByFormula: `AND({id} = '${masterId}', {status} = 'Activated')` })
            .firstPage();
        return masterRecords.length > 0;
    }
    async isCountryActivated(masterId) {
        const masterRecords = await this.base('Utilisateurs')
            .select({
            filterByFormula: `{id} = '${masterId}'`,
            fields: ['pays_id'],
        })
            .firstPage();
        if (masterRecords.length === 0) {
            throw new Error('Le Master spécifié est introuvable.');
        }
        const countryId = masterRecords[0].fields.pays_id?.[0];
        if (!countryId) {
            throw new Error('Aucun pays associé à ce Master.');
        }
        const countryRecords = await this.base('Pays')
            .select({ filterByFormula: `AND({id} = '${countryId}', {status} = 'Activated')` })
            .firstPage();
        return countryRecords.length > 0;
    }
    async useCodeRecharge(masterId, code) {
        const records = await this.base('CodesRecharge')
            .select({
            filterByFormula: `{code} = '${code}'`,
        })
            .firstPage();
        if (records.length === 0) {
            throw new Error('Ce code de recharge n\'existe pas.');
        }
        const codeRecord = records[0];
        const montant = codeRecord.fields.montant;
        const associatedMasterId = codeRecord.fields.master_id?.[0];
        if (associatedMasterId !== masterId) {
            throw new Error('Ce code de recharge n\'est pas associé à cet utilisateur.');
        }
        const status = codeRecord.fields.status;
        if (status !== 'Activated') {
            throw new Error('Ce code de recharge a déjà été utilisé.');
        }
        await this.base('CodesRecharge').update(codeRecord.id, { status: 'Deactivated' });
        return { montant };
    }
    async getCodeRechargeIdByCode(code) {
        const records = await this.base('CodesRecharge')
            .select({ filterByFormula: `{code} = '${code}'` })
            .firstPage();
        if (records.length === 0) {
            throw new Error('Code de recharge introuvable.');
        }
        return records[0].id;
    }
};
exports.CodesRechargeService = CodesRechargeService;
exports.CodesRechargeService = CodesRechargeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], CodesRechargeService);
//# sourceMappingURL=codes-recharge.service.js.map