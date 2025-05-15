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
exports.CommissionnementService = void 0;
const common_1 = require("@nestjs/common");
const Airtable = require("airtable");
const config_1 = require("../config");
let CommissionnementService = class CommissionnementService {
    base;
    constructor() {
        if (!config_1.Config.AIRTABLE_API_KEY || !config_1.Config.AIRTABLE_BASE_ID) {
            throw new Error('AIRTABLE_API_KEY or AIRTABLE_BASE_ID is not defined in the environment variables');
        }
        Airtable.configure({ apiKey: config_1.Config.AIRTABLE_API_KEY });
        this.base = Airtable.base(config_1.Config.AIRTABLE_BASE_ID);
    }
    async getAllCommissionnements() {
        const records = await this.base('Commissionnement').select().all();
        return records.map((record) => ({ id: record.id, ...record.fields }));
    }
    async getCommissionnementById(id) {
        const records = await this.base('Commissionnement')
            .select({ filterByFormula: `{id} = '${id}'` })
            .firstPage();
        if (records.length === 0) {
            throw new Error('Taux de commissionnement non trouvé.');
        }
        return { id: records[0].id, ...records[0].fields };
    }
    async createCommissionnement(commissionData) {
        const { typeUtilisateur, pourcentage } = commissionData;
        if (!this.isValidTypeUtilisateur(typeUtilisateur)) {
            throw new Error(`Le type d'utilisateur "${typeUtilisateur}" n'est pas autorisé. Les valeurs autorisées sont : MARCHAND, MASTER, ADMIN, TAXE.`);
        }
        const isUnique = await this.isTypeUtilisateurUnique(typeUtilisateur);
        if (!isUnique) {
            throw new Error(`Un pourcentage de commissionnement pour le type d'utilisateur "${typeUtilisateur}" existe déjà.`);
        }
        try {
            const createdRecords = await this.base('Commissionnement').create([{ fields: commissionData }]);
            return { id: createdRecords[0].id, ...createdRecords[0].fields };
        }
        catch (error) {
            throw new Error(`Erreur lors de la création du taux de commissionnement : ${error.message}`);
        }
    }
    async updateCommissionnement(id, updatedData) {
        const { typeUtilisateur } = updatedData;
        if (typeUtilisateur && !this.isValidTypeUtilisateur(typeUtilisateur)) {
            throw new Error(`Le type d'utilisateur "${typeUtilisateur}" n'est pas autorisé. Les valeurs autorisées sont : MARCHAND, MASTER, ADMIN.`);
        }
        if (typeUtilisateur) {
            const existingRecord = await this.base('Commissionnement')
                .select({ filterByFormula: `AND({typeUtilisateur} = '${typeUtilisateur}', NOT({id} = '${id}'))` })
                .firstPage();
            if (existingRecord.length > 0) {
                throw new Error(`Un pourcentage de commissionnement pour le type d'utilisateur "${typeUtilisateur}" existe déjà.`);
            }
        }
        try {
            await this.base('Commissionnement').update(id, updatedData);
            return { message: 'Taux de commissionnement mis à jour avec succès.' };
        }
        catch (error) {
            throw new Error(`Erreur lors de la mise à jour du taux de commissionnement : ${error.message}`);
        }
    }
    async deleteCommissionnement(id) {
        try {
            await this.base('Commissionnement').destroy(id);
            return { message: 'Taux de commissionnement supprimé avec succès.' };
        }
        catch (error) {
            throw new Error(`Erreur lors de la suppression du taux de commissionnement : ${error.message}`);
        }
    }
    isValidTypeUtilisateur(typeUtilisateur) {
        const allowedTypes = ['MARCHAND', 'MASTER', 'ADMIN', 'TAXE'];
        return allowedTypes.includes(typeUtilisateur);
    }
    async isTypeUtilisateurUnique(typeUtilisateur) {
        const records = await this.base('Commissionnement')
            .select({ filterByFormula: `{typeUtilisateur} = '${typeUtilisateur}'` })
            .firstPage();
        return records.length === 0;
    }
    async getCommissionsByOperation(typeOperation, paysId) {
        try {
            console.log(`Récupération des commissions pour l'opération : ${typeOperation}`);
            const records = await this.base('Commissionnement')
                .select({
                filterByFormula: `AND({typeOperation} = '${typeOperation}', {pays_id} = '${paysId}')`,
            })
                .all();
            if (records.length === 0) {
                throw new Error(`Aucune commission trouvée pour l'opération : ${typeOperation}`);
            }
            return records;
        }
        catch (error) {
            console.error(`Erreur lors de la récupération des commissions :`, error.message);
            throw error;
        }
    }
};
exports.CommissionnementService = CommissionnementService;
exports.CommissionnementService = CommissionnementService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], CommissionnementService);
//# sourceMappingURL=commissionnement.service.js.map