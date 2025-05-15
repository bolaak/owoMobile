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
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const Airtable = require("airtable");
const config_1 = require("../config");
let TransactionsService = class TransactionsService {
    base;
    constructor() {
        if (!config_1.Config.AIRTABLE_API_KEY || !config_1.Config.AIRTABLE_BASE_ID) {
            throw new Error('AIRTABLE_API_KEY or AIRTABLE_BASE_ID is not defined in the environment variables');
        }
        Airtable.configure({ apiKey: config_1.Config.AIRTABLE_API_KEY });
        this.base = Airtable.base(config_1.Config.AIRTABLE_BASE_ID);
    }
    async createTransaction(transactionData) {
        try {
            console.log('Données brutes reçues pour la transaction :', transactionData);
            const formattedData = {
                ...transactionData,
                utilisateur_id: [transactionData.utilisateur_id],
                code_recharge_id: [transactionData.code_recharge_id],
            };
            console.log('Données formatées pour Airtable :', formattedData);
            const createdRecords = await this.base('Transactions').create([{ fields: formattedData }]);
            return { id: createdRecords[0].id, ...createdRecords[0].fields };
        }
        catch (error) {
            console.error('Erreur lors de la création de la transaction :', error.message);
            throw new Error(`Erreur lors de la création de la transaction : ${error.message}`);
        }
    }
    async createTransactionAppro(transactionData) {
        try {
            const formattedData = {
                ...transactionData,
                expediteur_id: [transactionData.expediteur_id],
                destinataire_id: [transactionData.destinataire_id],
            };
            const createdRecords = await this.base('Transactions').create([{ fields: formattedData }]);
            return { id: createdRecords[0].id, ...createdRecords[0].fields };
        }
        catch (error) {
            throw new Error(`Erreur lors de la création de la transaction : ${error.message}`);
        }
    }
    async useCodeRecharge(masterId, code) {
        const records = await this.base('CodesRecharge')
            .select({
            filterByFormula: `AND({code} = '${code}', {master_id} = '${masterId}', {status} = 'Activated')`,
        })
            .firstPage();
        if (records.length === 0) {
            throw new Error('Code de recharge invalide ou déjà utilisé.');
        }
        const codeRecord = records[0];
        const montant = codeRecord.fields.montant;
        await this.base('CodesRecharge').update(codeRecord.id, { status: 'Deactivated' });
        return { montant };
    }
    async createCommissionTransaction(montant, compteCommissionId, destinataireId, description) {
        try {
            console.log(`Création d'une transaction de commission...`);
            await this.base('Transactions').create({
                type_operation: 'COMMISSION',
                montant,
                compteCommission: [compteCommissionId],
                expediteur_id: null,
                destinataire_id: [destinataireId],
                description,
                status: 'SUCCESS',
            });
            console.log(`Transaction de commission créée avec succès.`);
        }
        catch (error) {
            console.error(`Erreur lors de la création de la transaction de commission : ${error.message}`);
            throw error;
        }
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map