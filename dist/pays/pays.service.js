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
exports.PaysService = void 0;
const common_1 = require("@nestjs/common");
const Airtable = require("airtable");
const config_1 = require("../config");
let PaysService = class PaysService {
    base;
    constructor() {
        if (!config_1.Config.AIRTABLE_API_KEY) {
            throw new Error('AIRTABLE_API_KEY is not defined in the environment variables');
        }
        if (!config_1.Config.AIRTABLE_BASE_ID) {
            throw new Error('AIRTABLE_BASE_ID is not defined in the environment variables');
        }
        Airtable.configure({ apiKey: config_1.Config.AIRTABLE_API_KEY });
        this.base = Airtable.base(config_1.Config.AIRTABLE_BASE_ID);
    }
    async getAllPays() {
        const records = await this.base('Pays').select().all();
        return records.map((record) => ({ id: record.id, ...record.fields }));
    }
    async getPaysById(id) {
        const records = await this.base('Pays')
            .select({ filterByFormula: `{id} = '${id}'` })
            .firstPage();
        if (records.length === 0) {
            throw new Error('Pays non trouvé.');
        }
        return { id: records[0].id, ...records[0].fields };
    }
    async createPays(paysData) {
        try {
            const createdRecords = await this.base('Pays').create([{ fields: paysData }]);
            return { id: createdRecords[0].id, ...createdRecords[0].fields };
        }
        catch (error) {
            throw new Error(`Erreur lors de la création du pays : ${error.message}`);
        }
    }
    async updatePays(id, updatedData) {
        try {
            await this.base('Pays').update(id, updatedData);
            return { message: 'Pays mis à jour avec succès.' };
        }
        catch (error) {
            throw new Error(`Erreur lors de la mise à jour du pays : ${error.message}`);
        }
    }
    async deletePays(id) {
        try {
            await this.base('Pays').destroy(id);
            return { message: 'Pays supprimé avec succès.' };
        }
        catch (error) {
            throw new Error(`Erreur lors de la suppression du pays : ${error.message}`);
        }
    }
    async updatePaysStatus(id, status) {
        console.log(`Tentative de mise à jour du statut du pays avec ID ${id} vers "${status}".`);
        const pays = await this.getPaysById(id);
        console.log(`Statut actuel du pays : ${pays.status}`);
        if (pays.status === status) {
            console.warn(`Le pays est déjà ${status.toLowerCase()}. Aucune mise à jour nécessaire.`);
            throw new Error(`Le pays est déjà ${status.toLowerCase()}.`);
        }
        try {
            await this.base('Pays').update(id, { status });
            console.log(`Statut du pays mis à jour avec succès vers "${status}".`);
            return { message: `Le statut du pays a été mis à jour à "${status}".` };
        }
        catch (error) {
            console.error(`Erreur lors de la mise à jour du statut du pays : ${error.message}`);
            throw new Error(`Erreur lors de la mise à jour du statut du pays : ${error.message}`);
        }
    }
};
exports.PaysService = PaysService;
exports.PaysService = PaysService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PaysService);
//# sourceMappingURL=pays.service.js.map