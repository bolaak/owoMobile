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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsController = void 0;
const common_1 = require("@nestjs/common");
const master_guard_1 = require("../auth/master.guard");
const admin_guard_1 = require("../auth/admin.guard");
const marchand_guard_1 = require("../auth/marchand.guard");
const client_guard_1 = require("../auth/client.guard");
const codes_recharge_service_1 = require("../codes-recharge/codes-recharge.service");
const users_service_1 = require("../users/users.service");
const transactions_service_1 = require("./transactions.service");
const grille_tarifaire_service_1 = require("../grille-tarifaire/grille-tarifaire.service");
let TransactionsController = class TransactionsController {
    codesRechargeService;
    usersService;
    grilleTarifaireService;
    transactionsService;
    constructor(codesRechargeService, usersService, grilleTarifaireService, transactionsService) {
        this.codesRechargeService = codesRechargeService;
        this.usersService = usersService;
        this.grilleTarifaireService = grilleTarifaireService;
        this.transactionsService = transactionsService;
    }
    async rechargeCompte(rechargeData) {
        const { master_id, code } = rechargeData;
        try {
            const masterRecords = await this.usersService.getUserById(master_id);
            const userType = masterRecords.type_utilisateur;
            if (userType !== 'MASTER') {
                throw new Error('L\'utilisateur spécifié n\'est pas de type Master.');
            }
            const { montant } = await this.codesRechargeService.useCodeRecharge(master_id, code);
            const { solde } = await this.usersService.creditSolde(master_id, montant);
            const codeRechargeId = await this.codesRechargeService.getCodeRechargeIdByCode(code);
            await this.transactionsService.createTransaction({
                type_operation: 'RECHARGE',
                description: 'RECHARGEMENT DE COMPTE',
                montant,
                utilisateur_id: master_id,
                code_recharge_id: codeRechargeId,
                status: 'SUCCESS',
            });
            return { message: 'Rechargement effectué avec succès.', nouveau_solde: solde };
        }
        catch (error) {
            throw new Error(`Erreur lors du rechargement : ${error.message}`);
        }
    }
    async approvisionnerMarchand(approvisionnementData) {
        const { master_numero_compte, marchand_numero_compte, montant, motif, pin } = approvisionnementData;
        try {
            console.log('Données reçues :', approvisionnementData);
            console.log('Récupération des données du Master...');
            const masterRecord = await this.usersService.getUserByNumeroCompte(master_numero_compte);
            console.log('Master trouvé :', masterRecord);
            console.log('Récupération des données du Marchand...');
            const marchandRecord = await this.usersService.getUserByNumeroCompte(marchand_numero_compte);
            console.log('Marchand trouvé :', marchandRecord);
            console.log('Vérification du type utilisateur (Master)...');
            await this.usersService.validateUserType(masterRecord.id, 'MASTER');
            console.log('Vérification du type utilisateur (Marchand)...');
            await this.usersService.validateUserType(marchandRecord.id, 'MARCHAND');
            console.log('Vérification du statut du Master...');
            await this.usersService.checkCountryStatusForUser(masterRecord.id);
            console.log('Vérification du statut du Master...');
            await this.usersService.checkUserStatusMaster(master_numero_compte);
            console.log('Vérification du statut du Marchand...');
            await this.usersService.checkCountryStatusForMarchand(marchandRecord.id);
            console.log('Vérification du statut du Marchand...');
            await this.usersService.checkUserStatusMarchand(marchand_numero_compte);
            console.log('Vérification du rattachement Master-Marchand...');
            const marchandsDuMaster = await this.usersService.getMarchandsByMaster(masterRecord.id);
            const isMarchandRattache = marchandsDuMaster.some((marchand) => marchand.id === marchandRecord.id);
            if (!isMarchandRattache) {
                console.log('Ce Marchand n/est pas rattaché à ce Master.');
                throw new Error("Ce Marchand n'est pas rattaché à ce Master.");
            }
            console.log('Vérification du solde du Master...');
            await this.usersService.validateSolde(masterRecord.id, montant);
            console.log('Vérification du code PIN du Master...');
            await this.usersService.validatePIN(master_numero_compte, pin);
            console.log('Génération du code OTP...');
            await this.usersService.generateOTP(masterRecord.id, marchandRecord.id, montant);
            return { message: 'Un code OTP a été envoyé à votre adresse e-mail. Veuillez le saisir pour valider l\'opération.' };
        }
        catch (error) {
            console.error('Erreur interceptée :', error.message);
            throw new Error(`Erreur lors de l'approvisionnement : ${error.message}`);
        }
    }
    async validerOperation(validationData) {
        const { master_numero_compte, marchand_numero_compte, montant, motif, otpCode } = validationData;
        try {
            console.log('Données reçues pour la validation :', validationData);
            console.log('Récupération des données du Master...');
            const masterRecord = await this.usersService.getUserByNumeroCompte(master_numero_compte);
            console.log('Master trouvé :', masterRecord);
            console.log('Vérification du statut du Master...');
            await this.usersService.checkUserStatus(master_numero_compte);
            console.log('Récupération des données du Marchand...');
            const marchandRecord = await this.usersService.getUserByNumeroCompte(marchand_numero_compte);
            console.log('Marchand trouvé :', marchandRecord);
            console.log('Vérification du statut du Marchand...');
            await this.usersService.checkUserStatus(marchand_numero_compte);
            console.log('Validation du code OTP...');
            await this.usersService.validateOTP(masterRecord.id, marchandRecord.id, otpCode, montant);
            console.log('Exécution de l\'opération...');
            const resultat = await this.usersService.executerOperation(master_numero_compte, marchand_numero_compte, montant, motif);
            return { message: 'Opération exécutée avec succès.', ...resultat };
        }
        catch (error) {
            console.error('Erreur lors de la validation ou de l\'exécution de l\'opération :', error.message);
            throw new Error(`Erreur lors de la validation ou de l'exécution de l'opération : ${error.message}`);
        }
    }
    async approvisionnerClient(approvisionnementData) {
        const { client_numero_compte, marchand_numero_compte, montant, motif, pin } = approvisionnementData;
        try {
            console.log('Données reçues :', approvisionnementData);
            await this.usersService.validateDifferentAccounts(marchand_numero_compte, client_numero_compte);
            console.log('Récupération des données du Client...');
            const clientRecord = await this.usersService.getUserByNumeroCompte(client_numero_compte);
            console.log('Client trouvé :', clientRecord);
            console.log('Récupération des données du Marchand...');
            const marchandRecord = await this.usersService.getUserByNumeroCompte(marchand_numero_compte);
            console.log('Marchand trouvé :', marchandRecord);
            await this.usersService.validateSameCountry(marchand_numero_compte, client_numero_compte);
            console.log('Vérification du type utilisateur (Client)...');
            await this.usersService.validateUserType(clientRecord.id, 'CLIENT');
            console.log('Vérification du type utilisateur (Marchand)...');
            await this.usersService.validateUserType(marchandRecord.id, 'MARCHAND');
            console.log('Vérification du statut du Client...');
            await this.usersService.checkCountryStatusForUser(clientRecord.id);
            console.log('Vérification du statut du Client...');
            await this.usersService.checkUserStatus(client_numero_compte);
            console.log('Vérification du statut du Marchand...');
            await this.usersService.checkCountryStatusForMarchand(marchandRecord.id);
            console.log('Vérification du statut du Marchand...');
            await this.usersService.checkUserStatusMarchand(marchand_numero_compte);
            console.log('Vérification du solde du Marchand...');
            await this.usersService.validateSolde(marchandRecord.id, montant);
            console.log('Vérification du code PIN du Master...');
            await this.usersService.validatePIN(marchand_numero_compte, pin);
            console.log('Génération du code OTP...');
            await this.usersService.generateOTP(marchandRecord.id, clientRecord.id, montant);
            return { message: 'Un code OTP a été envoyé à votre adresse e-mail. Veuillez le saisir pour valider l\'opération.' };
        }
        catch (error) {
            console.error('Erreur interceptée :', error.message);
            throw new Error(`Erreur lors de l'approvisionnement : ${error.message}`);
        }
    }
    async validerDepot(validationData) {
        const { client_numero_compte, marchand_numero_compte, montant, motif, otpCode } = validationData;
        try {
            console.log('Données reçues pour la validation :', validationData);
            console.log('Récupération des données du Client...');
            const clientRecord = await this.usersService.getUserByNumeroCompte(client_numero_compte);
            console.log('Client trouvé :', clientRecord);
            console.log('Vérification du statut du Client...');
            await this.usersService.checkUserStatus(client_numero_compte);
            console.log('Récupération des données du Marchand...');
            const marchandRecord = await this.usersService.getUserByNumeroCompte(marchand_numero_compte);
            console.log('Marchand trouvé :', marchandRecord);
            console.log('Vérification du statut du Marchand...');
            await this.usersService.checkUserStatus(marchand_numero_compte);
            console.log('Validation du code OTP...');
            await this.usersService.validateOTP(marchandRecord.id, clientRecord.id, otpCode, montant);
            console.log('Exécution de l\'opération...');
            const resultat = await this.usersService.executerOperationDepot(marchand_numero_compte, client_numero_compte, montant, motif);
            return { message: 'Opération exécutée avec succès.', ...resultat };
        }
        catch (error) {
            console.error('Erreur lors de la validation ou de l\'exécution de l\'opération :', error.message);
            throw new Error(`Erreur lors de la validation ou de l'exécution de l'opération : ${error.message}`);
        }
    }
    async transfert(transfertData) {
        const { client1_numero_compte, client2_numero_compte, montant, motif, pin } = transfertData;
        try {
            console.log('Données reçues pour le transfert :', transfertData);
            await this.usersService.validateDifferentAccounts(client1_numero_compte, client2_numero_compte);
            console.log('Récupération des données du Client1...');
            const client1Record = await this.usersService.getUserByNumeroCompte(client1_numero_compte);
            console.log('Client 1 trouvé :', client1Record);
            console.log('Récupération des données du Client2...');
            const client2Record = await this.usersService.getUserByNumeroCompte(client2_numero_compte);
            console.log('client 2 trouvé :', client2Record);
            await this.usersService.validateSameCountry(client1_numero_compte, client2_numero_compte);
            console.log('Vérification du type utilisateur (Client 1)...');
            await this.usersService.validateUserType(client1Record.id, 'CLIENT');
            console.log('Vérification du type utilisateur (Client 2)...');
            await this.usersService.validateUserType(client2Record.id, 'CLIENT');
            console.log('Vérification du statut du Client 1...');
            await this.usersService.checkCountryStatusForUser(client1Record.id);
            console.log('Vérification du statut du Client 1...');
            await this.usersService.checkUserStatus(client1_numero_compte);
            console.log('Vérification du statut du Client 2...');
            await this.usersService.checkCountryStatusForUser(client2Record.id);
            console.log('Vérification du statut du Client 2...');
            await this.usersService.checkUserStatus(client2_numero_compte);
            const pays_id = client1Record.pays_id?.[0];
            const type_operation = 'TRANSFERT';
            const fraisTransfert = await this.grilleTarifaireService.getFraisOperation(pays_id, type_operation, montant);
            const montantTotal = montant + fraisTransfert;
            await this.usersService.validateSolde(client1Record.id, montantTotal);
            await this.usersService.validatePIN(client1_numero_compte, pin);
            console.log('Génération du code OTP...');
            await this.usersService.generateOTP(client1Record.id, client2Record.id, montant);
            return { message: 'Un code OTP a été envoyé à votre adresse e-mail. Veuillez le saisir pour valider l\'opération.' };
        }
        catch (error) {
            console.error('Erreur interceptée :', error.message);
            throw new Error(`Erreur lors de l'approvisionnement : ${error.message}`);
        }
    }
    async validerTransfert(validationData) {
        const { client1_numero_compte, client2_numero_compte, montant, motif, otpCode } = validationData;
        try {
            console.log('Données reçues pour la validation :', validationData);
            console.log('Récupération des données du Client 1...');
            const client1Record = await this.usersService.getUserByNumeroCompte(client1_numero_compte);
            console.log('Client trouvé :', client1Record);
            console.log('Vérification du statut du Client...');
            await this.usersService.checkUserStatus(client1_numero_compte);
            console.log('Récupération des données du Marchand...');
            const client2Record = await this.usersService.getUserByNumeroCompte(client2_numero_compte);
            console.log('Marchand trouvé :', client2Record);
            console.log('Vérification du statut du Marchand...');
            await this.usersService.checkUserStatus(client2_numero_compte);
            const pays_id = client1Record.pays_id?.[0];
            const type_operation = 'TRANSFERT';
            const fraisTransfert = await this.grilleTarifaireService.getFraisOperation(pays_id, type_operation, montant);
            const montantTotal = montant + fraisTransfert;
            console.log('Validation du code OTP...');
            await this.usersService.validateOTP(client1Record.id, client2Record.id, otpCode, montant);
            console.log('Exécution de l\'opération...');
            const resultat = await this.usersService.executerOperationTransfert(client1_numero_compte, client2_numero_compte, montant, motif);
            return { message: 'Opération exécutée avec succès.', ...resultat };
        }
        catch (error) {
            console.error('Erreur lors de la validation ou de l\'exécution de l\'opération :', error.message);
            throw new Error(`Erreur lors de la validation ou de l'exécution de l'opération : ${error.message}`);
        }
    }
    async retraitClient(approvisionnementData) {
        const { marchand_numero_compte, client_numero_compte, montant, pin } = approvisionnementData;
        try {
            console.log('Données reçues :', approvisionnementData);
            await this.usersService.validateDifferentAccounts(marchand_numero_compte, client_numero_compte);
            console.log('Récupération des données du Client...');
            const clientRecord = await this.usersService.getUserByNumeroCompte(client_numero_compte);
            console.log('Client trouvé :', clientRecord);
            console.log('Récupération des données du Marchand...');
            const marchandRecord = await this.usersService.getUserByNumeroCompte(marchand_numero_compte);
            console.log('Marchand trouvé :', marchandRecord);
            await this.usersService.validateSameCountry(marchand_numero_compte, client_numero_compte);
            console.log('Vérification du type utilisateur (Client)...');
            await this.usersService.validateUserType(clientRecord.id, 'CLIENT');
            console.log('Vérification du type utilisateur (Marchand)...');
            await this.usersService.validateUserType(marchandRecord.id, 'MARCHAND');
            console.log('Vérification du statut du Client...');
            await this.usersService.checkCountryStatusForUser(clientRecord.id);
            console.log('Vérification du statut du Client...');
            await this.usersService.checkUserStatus(client_numero_compte);
            console.log('Vérification du statut du Marchand...');
            await this.usersService.checkCountryStatusForMarchand(marchandRecord.id);
            console.log('Vérification du statut du Marchand...');
            await this.usersService.checkUserStatusMarchand(marchand_numero_compte);
            const pays_id = clientRecord.pays_id?.[0];
            const type_operation = 'RETRAIT';
            const fraisTransfert = await this.grilleTarifaireService.getFraisOperation(pays_id, type_operation, montant);
            const montantTotal = montant + fraisTransfert;
            console.log('Vérification du solde du Marchand...');
            await this.usersService.validateSolde(clientRecord.id, montantTotal);
            console.log('Vérification du code PIN du Master...');
            await this.usersService.validatePIN(client_numero_compte, pin);
            console.log('Génération du code OTP...');
            await this.usersService.generateOTP(clientRecord.id, marchandRecord.id, montant);
            return { message: 'Un code OTP a été envoyé à votre adresse e-mail. Veuillez le saisir pour valider l\'opération.' };
        }
        catch (error) {
            console.error('Erreur interceptée :', error.message);
            throw new Error(`Erreur lors de l'approvisionnement : ${error.message}`);
        }
    }
    async validerRetrait(validationData) {
        const { client_numero_compte, marchand_numero_compte, montant, motif, otpCode } = validationData;
        try {
            console.log('Données reçues pour la validation :', validationData);
            console.log('Récupération des données du Client 1...');
            const clientRecord = await this.usersService.getUserByNumeroCompte(client_numero_compte);
            console.log('Client trouvé :', clientRecord);
            console.log('Vérification du statut du Client...');
            await this.usersService.checkUserStatus(client_numero_compte);
            console.log('Récupération des données du Marchand...');
            const marchandRecord = await this.usersService.getUserByNumeroCompte(marchand_numero_compte);
            console.log('Marchand trouvé :', marchandRecord);
            console.log('Vérification du statut du Marchand...');
            await this.usersService.checkUserStatus(marchand_numero_compte);
            console.log('Validation du code OTP...');
            await this.usersService.validateOTP(clientRecord.id, marchandRecord.id, otpCode, montant);
            console.log('Exécution de l\'opération...');
            const resultat = await this.usersService.executerOperationRetrait(client_numero_compte, marchand_numero_compte, montant, motif);
            return { message: 'Opération exécutée avec succès.', ...resultat };
        }
        catch (error) {
            console.error('Erreur lors de la validation ou de l\'exécution de l\'opération :', error.message);
            throw new Error(`Erreur lors de la validation ou de l'exécution de l'opération : ${error.message}`);
        }
    }
    async exchangeBalance(exchangeData) {
        const { typeOperation, direction, montant } = exchangeData;
        try {
            console.log('Données reçues pour l\'échange de soldes :', exchangeData);
            await this.usersService.exchangeBalance(typeOperation, direction, montant);
            return { message: 'Échange de soldes effectué avec succès.' };
        }
        catch (error) {
            console.error('Erreur lors de l\'échange de soldes :', error.message);
            throw new Error(`Erreur lors de l'échange de soldes : ${error.message}`);
        }
    }
    async payment(approvisionnementData) {
        const { client_numero_compte, marchand_numero_compte, montant, motif, pin } = approvisionnementData;
        try {
            console.log('Données reçues :', approvisionnementData);
            await this.usersService.validateDifferentAccounts(marchand_numero_compte, client_numero_compte);
            console.log('Récupération des données du Client...');
            const clientRecord = await this.usersService.getUserByNumeroCompte(client_numero_compte);
            console.log('Client trouvé :', clientRecord);
            console.log('Récupération des données du Marchand_Business...');
            const marchandRecord = await this.usersService.getUserByNumeroCompte(marchand_numero_compte);
            console.log('Marchand_Business trouvé :', marchandRecord);
            console.log('Vérification du type utilisateur (Client)...');
            await this.usersService.validateUserType(clientRecord.id, 'CLIENT');
            console.log('Vérification du type utilisateur (Marchand_Business)...');
            await this.usersService.validateUserType(marchandRecord.id, 'BUSINESS');
            console.log('Vérification du statut du Client...');
            await this.usersService.checkCountryStatusForUser(clientRecord.id);
            console.log('Vérification du statut du Client...');
            await this.usersService.checkUserStatus(client_numero_compte);
            console.log('Vérification du statut du Marchand_Business...');
            await this.usersService.checkCountryStatusForMarchand(marchandRecord.id);
            console.log('Vérification du statut du Marchand...');
            await this.usersService.checkUserStatusMarchand(marchand_numero_compte);
            console.log('Vérification du solde du Client...');
            await this.usersService.validateSolde(clientRecord.id, montant);
            console.log('Vérification du code PIN du Client...');
            await this.usersService.validatePIN(client_numero_compte, pin);
            console.log('Génération du code OTP...');
            await this.usersService.generateOTP(clientRecord.id, marchandRecord.id, montant);
            return { message: 'Un code OTP a été envoyé à votre adresse e-mail. Veuillez le saisir pour valider l\'opération.' };
        }
        catch (error) {
            console.error('Erreur interceptée :', error.message);
            throw new Error(`Erreur lors du paiement : ${error.message}`);
        }
    }
    async validerPayment(validationData) {
        const { client_numero_compte, marchand_numero_compte, montant, motif, otpCode } = validationData;
        try {
            console.log('Données reçues pour la validation :', validationData);
            console.log('Récupération des données du Client...');
            const clientRecord = await this.usersService.getUserByNumeroCompte(client_numero_compte);
            console.log('Client trouvé :', clientRecord);
            console.log('Vérification du statut du Client...');
            await this.usersService.checkUserStatus(client_numero_compte);
            console.log('Récupération des données du Marchand_Business...');
            const marchandRecord = await this.usersService.getUserByNumeroCompte(marchand_numero_compte);
            console.log('Marchand_Business trouvé :', marchandRecord);
            console.log('Vérification du statut du Marchand_Business...');
            await this.usersService.checkUserStatus(marchand_numero_compte);
            console.log('Validation du code OTP...');
            await this.usersService.validateOTP(clientRecord.id, marchandRecord.id, otpCode, montant);
            console.log('Exécution de l\'opération...');
            const resultat = await this.usersService.executerOperationPayment(marchand_numero_compte, client_numero_compte, montant, motif);
            return { message: 'Opération exécutée avec succès.', ...resultat };
        }
        catch (error) {
            console.error('Erreur lors de la validation ou de l\'exécution de l\'opération :', error.message);
            throw error;
        }
    }
};
exports.TransactionsController = TransactionsController;
__decorate([
    (0, common_1.Post)('recharge'),
    (0, common_1.UseGuards)(master_guard_1.MasterGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "rechargeCompte", null);
__decorate([
    (0, common_1.Post)('approvisionnement'),
    (0, common_1.UseGuards)(master_guard_1.MasterGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "approvisionnerMarchand", null);
__decorate([
    (0, common_1.Post)('valider-operation'),
    (0, common_1.UseGuards)(master_guard_1.MasterGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "validerOperation", null);
__decorate([
    (0, common_1.Post)('depot'),
    (0, common_1.UseGuards)(marchand_guard_1.MarchandGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "approvisionnerClient", null);
__decorate([
    (0, common_1.Post)('valider-depot'),
    (0, common_1.UseGuards)(marchand_guard_1.MarchandGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "validerDepot", null);
__decorate([
    (0, common_1.Post)('transfert'),
    (0, common_1.UseGuards)(client_guard_1.ClientGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "transfert", null);
__decorate([
    (0, common_1.Post)('valider-transfert'),
    (0, common_1.UseGuards)(client_guard_1.ClientGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "validerTransfert", null);
__decorate([
    (0, common_1.Post)('retrait'),
    (0, common_1.UseGuards)(marchand_guard_1.MarchandGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "retraitClient", null);
__decorate([
    (0, common_1.Post)('valider-retrait'),
    (0, common_1.UseGuards)(marchand_guard_1.MarchandGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "validerRetrait", null);
__decorate([
    (0, common_1.Post)('exchange-balance'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "exchangeBalance", null);
__decorate([
    (0, common_1.Post)('payment'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "payment", null);
__decorate([
    (0, common_1.Post)('valider-payment'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "validerPayment", null);
exports.TransactionsController = TransactionsController = __decorate([
    (0, common_1.Controller)('transactions'),
    __metadata("design:paramtypes", [codes_recharge_service_1.CodesRechargeService,
        users_service_1.UsersService,
        grille_tarifaire_service_1.GrilleTarifaireService,
        transactions_service_1.TransactionsService])
], TransactionsController);
//# sourceMappingURL=transactions.controller.js.map