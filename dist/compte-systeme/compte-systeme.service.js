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
exports.CompteSystemeService = void 0;
const common_1 = require("@nestjs/common");
const Airtable = require("airtable");
const config_1 = require("../config");
let CompteSystemeService = class CompteSystemeService {
    base;
    constructor() {
        if (!config_1.Config.AIRTABLE_API_KEY || !config_1.Config.AIRTABLE_BASE_ID) {
            throw new Error('AIRTABLE_API_KEY or AIRTABLE_BASE_ID is not defined in the environment variables');
        }
        Airtable.configure({ apiKey: config_1.Config.AIRTABLE_API_KEY });
        this.base = Airtable.base(config_1.Config.AIRTABLE_BASE_ID);
    }
    async getAllComptesSysteme() {
        const records = await this.base('CompteSysteme').select().all();
        return records.map((record) => ({ id: record.id, ...record.fields }));
    }
    async getCompteSystemeById(id) {
        const records = await this.base('CompteSysteme')
            .select({ filterByFormula: `{id} = '${id}'` })
            .firstPage();
        if (records.length === 0) {
            throw new Error('Compte système non trouvé.');
        }
        return { id: records[0].id, ...records[0].fields };
    }
    async createCompteSysteme(compteData) {
        const { typeOperation } = compteData;
        const isUnique = await this.isTypeOperationUnique(typeOperation);
        if (!isUnique) {
            throw new Error(`Un compte système pour le type d'opération "${typeOperation}" existe déjà.`);
        }
        try {
            const numero_compte = Math.floor(100000000 + Math.random() * 900000000).toString();
            const createdRecords = await this.base('CompteSysteme').create([
                {
                    fields: {
                        ...compteData,
                        numCompte: numero_compte,
                        solde: 0,
                    },
                },
            ]);
            return { id: createdRecords[0].id, ...createdRecords[0].fields };
        }
        catch (error) {
            throw new Error(`Erreur lors de la création du compte système : ${error.message}`);
        }
    }
    async updateCompteSysteme(id, updatedData) {
        try {
            await this.base('CompteSysteme').update(id, updatedData);
            return { message: 'Compte système mis à jour avec succès.' };
        }
        catch (error) {
            throw new Error(`Erreur lors de la mise à jour du compte système : ${error.message}`);
        }
    }
    async deleteCompteSysteme(id) {
        try {
            await this.base('CompteSysteme').destroy(id);
            return { message: 'Compte système supprimé avec succès.' };
        }
        catch (error) {
            throw new Error(`Erreur lors de la suppression du compte système : ${error.message}`);
        }
    }
    async isTypeOperationUnique(typeOperation) {
        const records = await this.base('CompteSysteme')
            .select({ filterByFormula: `{typeOperation} = '${typeOperation}'` })
            .firstPage();
        return records.length === 0;
    }
    async getCompteSystemeByTypeOperation(typeOperation) {
        try {
            console.log(`Recherche du compte système pour le type d'opération : ${typeOperation}`);
            const compteRecords = await this.base('CompteSysteme')
                .select({ filterByFormula: `{typeOperation} = '${typeOperation}'` })
                .firstPage();
            if (compteRecords.length === 0) {
                throw new Error(`Aucun compte système trouvé pour le type d'opération : ${typeOperation}`);
            }
            console.log(`Compte système trouvé :`, compteRecords[0]);
            return compteRecords[0];
        }
        catch (error) {
            console.error(`Erreur lors de la recherche du compte système : ${error.message}`);
            throw error;
        }
    }
    async crediterCompteSysteme(compteId, montant) {
        try {
            console.log(`Crédit du compte système ID : ${compteId}, Montant : ${montant}`);
            const compteRecords = await this.base('CompteSysteme')
                .select({ filterByFormula: `{id} = '${compteId}'` })
                .firstPage();
            if (compteRecords.length === 0) {
                throw new Error("Compte système introuvable.");
            }
            const soldeActuel = compteRecords[0].fields.solde || 0;
            const nouveauSolde = soldeActuel + montant;
            await this.base('CompteSysteme').update(compteId, { solde: nouveauSolde });
            console.log(`Nouveau solde du compte système ID ${compteId} : ${nouveauSolde}`);
        }
        catch (error) {
            console.error(`Erreur lors du crédit du compte système : ${error.message}`);
            throw error;
        }
    }
    async debiterCompteSysteme(compteId, montant) {
        try {
            console.log(`Dédit du compte système ID : ${compteId}, Montant : ${montant}`);
            const compteRecords = await this.base('CompteSysteme')
                .select({ filterByFormula: `{id} = '${compteId}'` })
                .firstPage();
            if (compteRecords.length === 0) {
                throw new Error("Compte système introuvable.");
            }
            const soldeActuel = compteRecords[0].fields.solde || 0;
            const nouveauSolde = soldeActuel - montant;
            await this.base('CompteSysteme').update(compteId, { solde: nouveauSolde });
            console.log(`Nouveau solde du compte système ID ${compteId} : ${nouveauSolde}`);
        }
        catch (error) {
            console.error(`Erreur lors du dédit du compte système : ${error.message}`);
            throw error;
        }
    }
    async updateSoldeSysteme(compteId, newSolde) {
        try {
            const compteRecords = await this.base('CompteSysteme')
                .select({ filterByFormula: `{id} = '${compteId}'` })
                .firstPage();
            if (compteRecords.length === 0) {
                throw new Error('Compte introuvable.');
            }
            await this.base('CompteSysteme').update(compteId, { solde: newSolde });
        }
        catch (error) {
            throw new Error(`Erreur lors de la mise à jour du solde : ${error.message}`);
        }
    }
};
exports.CompteSystemeService = CompteSystemeService;
exports.CompteSystemeService = CompteSystemeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], CompteSystemeService);
//# sourceMappingURL=compte-systeme.service.js.map