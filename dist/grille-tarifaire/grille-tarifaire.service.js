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
exports.GrilleTarifaireService = void 0;
const common_1 = require("@nestjs/common");
const Airtable = require("airtable");
const config_1 = require("../config");
let GrilleTarifaireService = class GrilleTarifaireService {
    base;
    constructor() {
        if (!config_1.Config.AIRTABLE_API_KEY || !config_1.Config.AIRTABLE_BASE_ID) {
            throw new Error('AIRTABLE_API_KEY or AIRTABLE_BASE_ID is not defined in the environment variables');
        }
        const airtable = new Airtable({ apiKey: config_1.Config.AIRTABLE_API_KEY });
        console.log('Airtable configured successfully:', airtable);
        this.base = airtable.base(config_1.Config.AIRTABLE_BASE_ID);
        console.log('Base initialized:', this.base);
    }
    async getAllGrilleTarifaire() {
        const records = await this.base('GrilleTarifaire').select().all();
        return records.map((record) => ({ id: record.id, ...record.fields }));
    }
    async getGrilleTarifaireById(id) {
        const records = await this.base('GrilleTarifaire')
            .select({ filterByFormula: `{id} = '${id}'` })
            .firstPage();
        if (records.length === 0) {
            throw new Error('Grille tarifaire non trouvée.');
        }
        return { id: records[0].id, ...records[0].fields };
    }
    async createGrilleTarifaire(grilleData) {
        const { min_montant, max_montant, pays_id, type_operation } = grilleData;
        if (min_montant >= max_montant) {
            throw new Error('Le montant minimum doit être strictement inférieur au montant maximum.');
        }
        await this.checkCountryExists(pays_id);
        grilleData.pays_id = Array.isArray(pays_id) ? pays_id : [pays_id];
        await this.validatePlageMontant(min_montant, max_montant, pays_id, type_operation);
        try {
            const createdRecords = await this.base('GrilleTarifaire').create([{ fields: grilleData }]);
            return { id: createdRecords[0].id, ...createdRecords[0].fields };
        }
        catch (error) {
            throw new Error(`Erreur lors de la création de la grille tarifaire : ${error.message}`);
        }
    }
    async updateGrilleTarifaire(id, updatedData) {
        const existingGrille = await this.getGrilleTarifaireById(id);
        const pays_id = existingGrille.pays_id[0];
        const type_operation = existingGrille.type_operation[0];
        const { min_montant, max_montant } = updatedData;
        if (min_montant >= max_montant) {
            throw new Error('Le montant minimum doit être strictement inférieur au montant maximum.');
        }
        await this.validatePlageMontant(min_montant, max_montant, pays_id, type_operation);
        try {
            await this.base('GrilleTarifaire').update(id, updatedData);
            return { message: 'Grille tarifaire mise à jour avec succès.' };
        }
        catch (error) {
            throw new Error(`Erreur lors de la mise à jour de la grille tarifaire : ${error.message}`);
        }
    }
    async deleteGrilleTarifaire(id) {
        try {
            await this.base('GrilleTarifaire').destroy(id);
            return { message: 'Grille tarifaire supprimée avec succès.' };
        }
        catch (error) {
            throw new Error(`Erreur lors de la suppression de la grille tarifaire : ${error.message}`);
        }
    }
    async validatePlageMontant(min_montant, max_montant, pays_id, type_operation) {
        const records = await this.base('GrilleTarifaire')
            .select({ filterByFormula: `{pays_id} = '${pays_id}', {type_operation} = '${type_operation}'` })
            .all();
        for (const record of records) {
            const existingMin = parseFloat(record.fields.min_montant);
            const existingMax = parseFloat(record.fields.max_montant);
            if ((min_montant >= existingMin && min_montant <= existingMax) ||
                (max_montant >= existingMin && max_montant <= existingMax) ||
                (min_montant <= existingMin && max_montant >= existingMax)) {
                throw new Error(`La plage [${min_montant}, ${max_montant}] chevauche une plage existante [${existingMin}, ${existingMax}] pour ce pays.`);
            }
        }
    }
    async checkCountryExists(countryId) {
        const country = await this.base('Pays').find(countryId);
        if (!country) {
            throw new Error('Le pays spécifié est introuvable.');
        }
    }
    async getGrilleTarifaireByCountryId(countryId) {
        const country = await this.base('Pays').find(countryId);
        if (!country) {
            throw new Error('Le pays spécifié est introuvable.');
        }
        const records = await this.base('GrilleTarifaire')
            .select({ filterByFormula: `{pays_id} = '${countryId}'` })
            .all();
        return records.map((record) => ({
            id: record.id,
            ...record.fields,
        }));
    }
    async getFraisOperation(pays_id, type_operation, montant) {
        try {
            console.log(`Récupération des frais pour pays_id : ${pays_id}, type_operation : ${type_operation}, montant : ${montant}`);
            const grilleRecords = await this.base('GrilleTarifaire')
                .select({
                filterByFormula: `AND({pays_id} = '${pays_id}', {type_operation} = '${type_operation}', {min_montant} <= ${montant}, {max_montant} >= ${montant})`,
            })
                .firstPage();
            if (grilleRecords.length === 0) {
                throw new Error("Aucune grille tarifaire trouvée pour les paramètres donnés.");
            }
            const frais = grilleRecords[0].fields.frais;
            console.log(`Frais trouvés : ${frais}`);
            return frais;
        }
        catch (error) {
            console.error(`Erreur lors de la récupération des frais : ${error.message}`);
            throw error;
        }
    }
};
exports.GrilleTarifaireService = GrilleTarifaireService;
exports.GrilleTarifaireService = GrilleTarifaireService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], GrilleTarifaireService);
//# sourceMappingURL=grille-tarifaire.service.js.map