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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const Airtable = require("airtable");
const bcrypt = require("bcrypt");
const uuid_1 = require("uuid");
const mail_service_1 = require("../mail/mail.service");
const transactions_service_1 = require("../transactions/transactions.service");
const config_1 = require("../config");
const grille_tarifaire_service_1 = require("../grille-tarifaire/grille-tarifaire.service");
const compte_systeme_service_1 = require("../compte-systeme/compte-systeme.service");
const commissionnement_service_1 = require("../commissionnement/commissionnement.service");
let UsersService = class UsersService {
    mailService;
    grilleTarifaireService;
    compteSystemeService;
    commissionsService;
    transactionsService;
    base;
    constructor(mailService, grilleTarifaireService, compteSystemeService, commissionsService, transactionsService) {
        this.mailService = mailService;
        this.grilleTarifaireService = grilleTarifaireService;
        this.compteSystemeService = compteSystemeService;
        this.commissionsService = commissionsService;
        this.transactionsService = transactionsService;
        const airtable = new Airtable({ apiKey: config_1.Config.AIRTABLE_API_KEY });
        if (!config_1.Config.AIRTABLE_BASE_ID) {
            throw new Error('AIRTABLE_BASE_ID is not defined in the environment variables');
        }
        this.base = airtable.base(config_1.Config.AIRTABLE_BASE_ID);
    }
    allowedFields = [
        'nom',
        'prenom',
        'date_naissance',
        'nationalite',
        'email',
        'telephone',
        'city',
        'adresse',
        'pays_id',
    ];
    async createUser(userData) {
        await this.checkCountryExists(userData.pays_id);
        await this.checkCountryStatus(userData.pays_id);
        await this.checkEmailUniqueness(userData.email);
        if (userData.type_utilisateur === 'MARCHAND') {
            if (!userData.code_marchand) {
                throw new Error('Le code marchand est requis pour créer un utilisateur de type Marchand.');
            }
            const master = await this.validateMerchantCode(userData.code_marchand);
            userData.master_id = master.id;
            userData.master_associated = master.nom;
        }
        const numero_compte = Math.floor(100000000 + Math.random() * 900000000).toString();
        const PIN = Math.floor(10000 + Math.random() * 90000).toString();
        const hashedPIN = await bcrypt.hash(PIN, 10);
        const mot_de_passe = (0, uuid_1.v4)().substring(0, 8);
        const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
        let code_marchand = null;
        if (userData.type_utilisateur === 'MASTER') {
            code_marchand = await this.generateUniqueMerchantCode();
        }
        if (userData.type_utilisateur === 'BUSINESS') {
            code_marchand = await this.generateUniqueMerchantCode();
        }
        try {
            console.log('Données à envoyer à Airtable :', {
                ...userData,
                numero_compte,
                PIN: hashedPIN,
                mot_de_passe: hashedPassword,
                solde: 0,
                tentatives_echec: 0,
                pays_id: [userData.pays_id],
                master_id: userData.master_id,
                master_associated: userData.master_associated,
            });
            await this.base('Utilisateurs').create([
                {
                    fields: {
                        ...userData,
                        numero_compte,
                        PIN: hashedPIN,
                        mot_de_passe: hashedPassword,
                        solde: 0,
                        tentatives_echec: 0,
                        pays_id: [userData.pays_id],
                        code_marchand: code_marchand,
                        master_id: userData.master_id ? userData.master_id : undefined,
                        master_associated: userData.master_associated ? userData.master_associated : undefined,
                    },
                },
            ]);
            const emailContent = `
        Bonjour ${userData.nom} ${userData.prenom},
        
        Votre compte Mobile Money a été créé avec succès. Voici vos informations de connexion :
        - Numéro de compte : ${numero_compte}
        - Code PIN : ${PIN}
        - Mot de passe : ${mot_de_passe}

      ${userData.type_utilisateur === 'MASTER' || userData.type_utilisateur === 'BUSINESS'
                ? `- Code marchand : ${code_marchand}\n`
                : ''}
      
        Veuillez conserver ces informations en sécurité. Un code PIN vous sera demandé lors des opérations sensibles.

      `;
            await this.mailService.sendMail(userData.email, 'Bienvenue sur Mobile Money - Détails de connexion', emailContent);
            return { numero_compte };
        }
        catch (error) {
            console.error('Erreur lors de la création de l\'utilisateur :', error.message, error.stack);
            throw new Error('Erreur lors de la création de l\'utilisateur');
        }
    }
    async validatePIN(numero_compte, pin) {
        console.log(`Validation du code PIN pour le numéro de compte : ${numero_compte}`);
        const user = await this.getUserByNumeroCompte(numero_compte);
        if (!user.PIN) {
            throw new Error('Code PIN non défini pour cet utilisateur');
        }
        const isValid = await bcrypt.compare(pin, user.PIN);
        if (!isValid) {
            throw new Error('Code PIN incorrect');
        }
        console.log(`Code PIN validé avec succès pour le numéro de compte : ${numero_compte}`);
        return true;
    }
    async checkEmailUniqueness(email) {
        const records = await this.base('Utilisateurs')
            .select({ filterByFormula: `{email} = '${email}'` })
            .firstPage();
        if (records.length > 0) {
            throw new Error('Cet email est déjà utilisé.');
        }
    }
    async checkCountryExists(pays_id) {
        const records = await this.base('Pays')
            .select({ filterByFormula: `{id} = '${pays_id}'` })
            .firstPage();
        if (records.length === 0) {
            throw new Error('Le pays spécifié est invalide.');
        }
    }
    async getUserById(id) {
        try {
            const records = await this.base('Utilisateurs')
                .select({ filterByFormula: `{id} = '${id}'` })
                .firstPage();
            if (records.length === 0) {
                throw new Error('Utilisateur non trouvé.');
            }
            const userFields = records[0].fields;
            delete userFields.PIN;
            delete userFields.master_id;
            delete userFields.destinataire;
            delete userFields.expediteur;
            delete userFields.CodesRecharge;
            delete userFields.recharge_master;
            delete userFields.OTP;
            console.log('Utilisateur récupéré avec succès (champs sensibles mot_de_passe et PIN  exclus).');
            return userFields;
        }
        catch (error) {
            console.error('Erreur lors de la récupération de l\'utilisateur :', error.message);
            throw new Error(`Erreur lors de la récupération de l'utilisateur : ${error.message}`);
        }
    }
    async getUserByNumeroCompte(numero_compte) {
        console.log(`Recherche de l'utilisateur avec le numéro de compte : ${numero_compte}`);
        const records = await this.base('Utilisateurs')
            .select({ filterByFormula: `{numero_compte} = '${numero_compte}'` })
            .firstPage();
        if (records.length === 0) {
            console.log(`Aucun utilisateur trouvé avec le numéro de compte : ${numero_compte}`);
            throw new Error('Utilisateur non trouvé.');
        }
        console.log(`Utilisateur trouvé :`, records[0]);
        return records[0].fields;
    }
    async validateDifferentAccounts(numeroCompte1, numeroCompte2) {
        if (numeroCompte1 === numeroCompte2) {
            throw new Error("Le compte à créditer ne peut pas être le même que le compte à débiter.");
        }
    }
    async validateSameCountry(numeroCompte1, numeroCompte2) {
        try {
            console.log(`Vérification que les comptes ${numeroCompte1} et ${numeroCompte2} sont du même pays...`);
            const compte1 = await this.getUserByNumeroCompte(numeroCompte1);
            const compte2 = await this.getUserByNumeroCompte(numeroCompte2);
            if (!compte1 || !compte2) {
                throw new Error("L\'un ou les deux comptes sont introuvables.");
            }
            const paysId1 = compte1.pays_id?.[0];
            const paysId2 = compte2.pays_id?.[0];
            if (paysId1 !== paysId2) {
                console.log(`Pays récupérés : paysId1 : ${paysId1}(${compte1.nom_pays}) et paysId1 :  ${paysId2}(${compte2.nom_pays}).`);
                throw new Error("Les deux comptes ne sont pas du même pays.");
            }
            console.log(`Validation réussie : Les comptes ${numeroCompte1} et ${numeroCompte2} sont du même pays.`);
        }
        catch (error) {
            console.error(`Erreur lors de la validation des comptes : ${error.message}`);
            throw error;
        }
    }
    async validateUserType(userId, userType) {
        try {
            console.log(`Validation du type utilisateur pour l'ID : ${userId}, Type attendu : ${userType}`);
            const userRecords = await this.base('Utilisateurs')
                .select({ filterByFormula: `AND({id} = '${userId}', {type_utilisateur} = '${userType}')` })
                .firstPage();
            if (userRecords.length === 0) {
                console.log(`L'utilisateur avec l'ID ${userId} n'est pas de type ${userType}`);
                throw new Error(`L'utilisateur spécifié n'est pas de type ${userType}.`);
            }
            console.log(`Validation réussie pour l'utilisateur ID : ${userId}, Type : ${userType}`);
        }
        catch (error) {
            console.error(`Erreur lors de la validation du type utilisateur : ${error.message}`);
            throw error;
        }
    }
    async validateSolde(userId, montant) {
        try {
            console.log(`Validation du solde pour l'utilisateur ID : ${userId}, Montant requis : ${montant}`);
            const userRecords = await this.base('Utilisateurs')
                .select({ filterByFormula: `{id} = '${userId}'` })
                .firstPage();
            if (userRecords.length === 0) {
                console.log(`Aucun utilisateur trouvé avec l'ID : ${userId}`);
                throw new Error('Utilisateur introuvable.');
            }
            const solde = userRecords[0].fields.solde || 0;
            console.log(`Solde actuel de l'utilisateur ID ${userId} : ${solde}`);
            if (solde < montant) {
                console.log(`Solde insuffisant pour l'utilisateur ID : ${userId}`);
                throw new Error('Solde insuffisant pour effectuer cette opération.');
            }
            console.log(`Validation du solde réussie pour l'utilisateur ID : ${userId}`);
        }
        catch (error) {
            console.error(`Erreur lors de la validation du solde : ${error.message}`);
            throw error;
        }
    }
    async updateSolde(userId, newSolde) {
        try {
            const userRecords = await this.base('Utilisateurs')
                .select({ filterByFormula: `{id} = '${userId}'` })
                .firstPage();
            if (userRecords.length === 0) {
                throw new Error('Utilisateur introuvable.');
            }
            await this.base('Utilisateurs').update(userId, { solde: newSolde });
        }
        catch (error) {
            throw new Error(`Erreur lors de la mise à jour du solde : ${error.message}`);
        }
    }
    async getAllUsers() {
        const records = await this.base('Utilisateurs').select().all();
        return records.map((record) => {
            const fields = record.fields;
            delete fields.mot_de_passe;
            delete fields.PIN;
            delete fields.pays_id;
            delete fields.master_id;
            delete fields.destinataire;
            delete fields.expediteur;
            delete fields.CodesRecharge;
            delete fields.recharge_master;
            delete fields.OTP;
            return { id: record.id, ...fields };
        });
    }
    async updateUser(id, updatedData) {
        try {
            if (updatedData.pays_id) {
                await this.checkCountryStatus(updatedData.pays_id);
                updatedData.pays_id = [updatedData.pays_id];
            }
            await this.base('Utilisateurs').update(id, updatedData);
            return { message: 'Utilisateur mis à jour avec succès.' };
        }
        catch (error) {
            throw new Error(`Erreur lors de la mise à jour de l'utilisateur : ${error.message}`);
        }
    }
    async deleteUser(id) {
        try {
            await this.base('Utilisateurs').destroy(id);
            return { message: 'Utilisateur supprimé avec succès.' };
        }
        catch (error) {
            throw new Error(`Erreur lors de la suppression de l'utilisateur : ${error.message}`);
        }
    }
    async generateNewPIN(id) {
        const newPIN = Math.floor(10000 + Math.random() * 90000).toString();
        const hashedPIN = await bcrypt.hash(newPIN, 10);
        try {
            await this.base('Utilisateurs').update(id, { PIN: hashedPIN });
            return newPIN;
        }
        catch (error) {
            throw new Error(`Erreur lors de la mise à jour du PIN : ${error.message}`);
        }
    }
    async sendPINToUser(numero_compte) {
        const user = await this.getUserByNumeroCompte(numero_compte);
        await this.checkCountryStatus(user.pays_id);
        await this.checkUserStatus(numero_compte);
        const newPIN = await this.generateNewPIN(user.id);
        const emailContent = `
    Bonjour ${user.nom} ${user.prenom},
    
    Voici votre nouveau code PIN : ${newPIN}.
    
    Conservez ce code en sécurité. Il est nécessaire pour valider vos opérations sensibles.
  `;
        try {
            await this.mailService.sendMail(user.email, 'Récupération de votre code PIN', emailContent);
            await this.resetFailedAttempts(numero_compte);
            return { message: 'Un nouveau code PIN a été envoyé à votre adresse email.' };
        }
        catch (error) {
            await this.incrementFailedAttempts(numero_compte);
            throw new Error('Erreur lors de l\'envoi du code PIN.');
        }
    }
    async checkUserStatus(numero_compte) {
        console.log(`Vérification du statut pour le numéro de compte : ${numero_compte}`);
        const user = await this.getUserByNumeroCompte(numero_compte);
        if (user.status === 'Deactivated') {
            throw new Error('Votre compte a été bloqué.');
        }
        console.log(`Statut validé avec succès pour le numéro de compte : ${numero_compte}`);
    }
    async checkUserStatusMaster(numero_compte) {
        console.log(`Vérification du statut pour le numéro de compte : ${numero_compte}`);
        const user = await this.getUserByNumeroCompte(numero_compte);
        if (user.status === 'Deactivated') {
            throw new Error('Le compte Master a été bloqué.');
        }
        console.log(`Statut validé avec succès pour le numéro de compte : ${numero_compte}`);
    }
    async checkUserStatusMarchand(numero_compte) {
        console.log(`Vérification du statut pour le numéro de compte : ${numero_compte}`);
        const user = await this.getUserByNumeroCompte(numero_compte);
        if (user.status === 'Deactivated') {
            throw new Error('Le compte Marchand a été bloqué.');
        }
        console.log(`Statut validé avec succès pour le numéro de compte : ${numero_compte}`);
    }
    async incrementFailedAttempts(numero_compte) {
        const user = await this.getUserByNumeroCompte(numero_compte);
        const newAttempts = (user.tentatives_echec || 0) + 1;
        if (newAttempts >= 3) {
            await this.base('Utilisateurs').update(user.id, { status: 'Deactivated', tentatives_echec: newAttempts });
            throw new Error('Votre compte a été bloqué après 3 tentatives infructueuses.');
        }
        await this.base('Utilisateurs').update(user.id, { tentatives_echec: newAttempts });
    }
    async resetFailedAttempts(numero_compte) {
        try {
            const user = await this.getUserByNumeroCompte(numero_compte);
            await this.base('Utilisateurs').update(user.id, { tentatives_echec: 0 });
            const updatedUser = await this.getUserByNumeroCompte(numero_compte);
            if (updatedUser.tentatives_echec !== 0) {
                throw new Error('Échec de la réinitialisation des tentatives infructueuses.');
            }
        }
        catch (error) {
            throw new Error(`Erreur lors de la réinitialisation des tentatives infructueuses : ${error.message}`);
        }
    }
    async unlockUser(numero_compte) {
        const user = await this.getUserByNumeroCompte(numero_compte);
        await this.checkCountryStatus(user.pays_id);
        if (user.status === 'Activated') {
            throw new Error('Le compte est déjà activé.');
        }
        await this.base('Utilisateurs').update(user.id, { status: 'Activated', tentatives_echec: 0 });
        return { message: 'Le compte a été débloqué avec succès.' };
    }
    async blockUser(numero_compte) {
        const user = await this.getUserByNumeroCompte(numero_compte);
        if (user.status === 'Deactivated') {
            throw new Error('Le compte est déjà bloqué.');
        }
        await this.base('Utilisateurs').update(user.id, { status: 'Deactivated' });
    }
    async generateNewPassword(id) {
        const newPassword = Math.random().toString(36).substring(2, 10);
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        try {
            await this.base('Utilisateurs').update(id, { mot_de_passe: hashedPassword });
            return newPassword;
        }
        catch (error) {
            throw new Error(`Erreur lors de la mise à jour du mot de passe : ${error.message}`);
        }
    }
    async sendPasswordToUser(numero_compte) {
        const user = await this.getUserByNumeroCompte(numero_compte);
        await this.checkCountryStatus(user.pays_id);
        await this.checkUserStatus(numero_compte);
        const newPassword = await this.generateNewPassword(user.id);
        const emailContent = `
    Bonjour ${user.nom} ${user.prenom},
    
    Voici votre nouveau mot de passe temporaire : ${newPassword}.
    
    Conservez ce mot de passe en sécurité. Il est nécessaire pour accéder à votre compte.
  `;
        await this.mailService.sendMail(user.email, 'Récupération de votre mot de passe', emailContent);
        return { message: 'Un nouveau mot de passe a été envoyé à votre adresse email.' };
    }
    async changePassword(userId, oldPassword, newPassword) {
        console.log('ID de l\'utilisateur reçu dans le service :', userId);
        const user = await this.getUserById(userId);
        await this.checkCountryStatus(user.pays_id);
        const isOldPasswordValid = await bcrypt.compare(oldPassword, user.mot_de_passe);
        if (!isOldPasswordValid) {
            throw new Error('L\'ancien mot de passe est incorrect.');
        }
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        try {
            await this.base('Utilisateurs').update(userId, { mot_de_passe: hashedNewPassword });
        }
        catch (error) {
            throw new Error(`Erreur lors du changement de mot de passe : ${error.message}`);
        }
    }
    async checkCountryStatus(countryId) {
        const country = await this.base('Pays')
            .find(countryId)
            .catch(() => {
            throw new Error('Erreur lors de la récupération du pays.');
        });
        if (!country || !country.fields.status) {
            throw new Error('Le pays sélectionné est introuvable ou n\'a pas de statut défini.');
        }
        if (country.fields.status !== 'Activated') {
            throw new Error('Les activités sont suspendues dans ce pays momentanément.');
        }
    }
    async checkCountryStatusForUser(userId) {
        const user = await this.getUserById(userId);
        if (!user.pays_id || user.pays_id.length === 0) {
            throw new Error('Aucun pays associé à cet utilisateur.');
        }
        const countryId = user.pays_id[0];
        const country = await this.base('Pays')
            .find(countryId)
            .catch(() => {
            throw new Error('Erreur lors de la récupération du pays.');
        });
        if (!country || !country.fields.status) {
            throw new Error('Le pays associé à cet utilisateur est introuvable ou n\'a pas de statut défini.');
        }
        if (country.fields.status !== 'Activated') {
            throw new Error('Le pays associé à votre compte n\'est pas activé.');
        }
    }
    async checkCountryStatusForClient(userId) {
        const user = await this.getUserById(userId);
        if (!user.pays_id || user.pays_id.length === 0) {
            throw new Error('Aucun pays associé au client.');
        }
        const countryId = user.pays_id[0];
        const country = await this.base('Pays')
            .find(countryId)
            .catch(() => {
            throw new Error('Erreur lors de la récupération du pays.');
        });
        if (!country || !country.fields.status) {
            throw new Error('Le pays associé au client est introuvable ou n\'a pas de statut défini.');
        }
        if (country.fields.status !== 'Activated') {
            throw new Error('Le pays associé au compte client n\'est pas activé.');
        }
    }
    async checkCountryStatusForMarchand(userId) {
        const user = await this.getUserById(userId);
        if (!user.pays_id || user.pays_id.length === 0) {
            throw new Error('Aucun pays associé au Marchand.');
        }
        const countryId = user.pays_id[0];
        const country = await this.base('Pays')
            .find(countryId)
            .catch(() => {
            throw new Error('Erreur lors de la récupération du pays.');
        });
        if (!country || !country.fields.status) {
            throw new Error('Le pays associé au Marchand est introuvable ou n\'a pas de statut défini.');
        }
        if (country.fields.status !== 'Activated') {
            throw new Error('Le pays associé au compte du Marchand n\'est pas activé.');
        }
    }
    async isMerchantCodeUnique(merchantCode) {
        const records = await this.base('Utilisateurs')
            .select({ filterByFormula: `{code_marchand} = '${merchantCode}'` })
            .firstPage();
        return records.length === 0;
    }
    async generateUniqueMerchantCode() {
        let merchantCode = null;
        let isUnique = false;
        while (!isUnique) {
            merchantCode = Math.floor(100000 + Math.random() * 900000).toString();
            isUnique = await this.isMerchantCodeUnique(merchantCode);
        }
        if (!merchantCode) {
            throw new Error('Impossible de générer un code marchand unique.');
        }
        return merchantCode;
    }
    async validateMerchantCode(merchantCode) {
        const masterRecords = await this.base('Utilisateurs')
            .select({ filterByFormula: `{code_marchand} = '${merchantCode}'` })
            .firstPage();
        if (masterRecords.length === 0) {
            throw new Error('Le code marchand est invalide.');
        }
        const master = masterRecords[0].fields;
        if (master.status !== 'Activated') {
            throw new Error('Le Master associé au code marchand n\'est pas activé.');
        }
        const countryId = master.pays_id[0];
        const country = await this.base('Pays').find(countryId);
        if (!country || country.fields.status !== 'Activated') {
            throw new Error('Le pays du Master n\'est pas activé.');
        }
        return master;
    }
    async getMarchandsByMaster(masterId) {
        const master = await this.getUserById(masterId);
        if (master.type_utilisateur !== 'MASTER') {
            throw new Error('L\'ID fourni ne correspond pas à un utilisateur de type MASTER.');
        }
        const marchandRecords = await this.base('Utilisateurs')
            .select({ filterByFormula: `{master_id} = '${masterId}'` })
            .all();
        return marchandRecords.map((record) => ({
            id: record.id,
            ...record.fields,
        }));
    }
    async getMasterByMarchand(marchandId) {
        try {
            console.log(`Recherche du Master pour le Marchand ID : ${marchandId}`);
            const marchandRecord = await this.base('Utilisateurs').find(marchandId);
            const masterId = marchandRecord.fields.master_id;
            if (!masterId) {
                throw new Error("Ce Marchand n'est pas rattaché à un Master.");
            }
            const masterRecord = await this.getUserById(masterId);
            console.log(`Master trouvé pour le Marchand ID ${marchandId} :`, masterRecord);
            return masterRecord;
        }
        catch (error) {
            console.error(`Erreur lors de la recherche du Master : ${error.message}`);
            throw error;
        }
    }
    async getAllMasters() {
        console.log('Début de la méthode getAllMasters');
        try {
            const records = await this.base('Utilisateurs').select().all();
            console.log('Records récupérés :', records);
            const masters = records
                .filter((record) => record.fields.type_utilisateur === 'MASTER')
                .map((record) => {
                const fields = record.fields;
                delete fields.mot_de_passe;
                return { id: record.id, ...fields };
            });
            console.log('Masters filtrés :', masters);
            return masters;
        }
        catch (error) {
            console.error('Erreur dans getAllMasters :', error.message);
            throw new Error(`Erreur lors de la récupération des utilisateurs de type MASTER : ${error.message}`);
        }
    }
    async shareCommissions(typeOperation, paysId, montantFrais, marchandNumeroCompte, compteSysteme) {
        try {
            console.log(`Partage des commissions pour l'opération : ${typeOperation}`);
            const commissions = await this.commissionsService.getCommissionsByOperation(typeOperation, paysId);
            console.log(`Les enregistrements récupérés pour l'opération ${typeOperation} du pays ${paysId} : ${commissions}`);
            const adminRecord = await this.getAdminAccount();
            console.log(`les données de ADMIN trouvées : ${adminRecord}`);
            const taxeRecord = await this.getTaxeAccount();
            console.log(`les données du GOUVERNEMENT trouvées : ${taxeRecord}`);
            const marchandRecord = await this.getUserByNumeroCompte(marchandNumeroCompte);
            console.log(`les données du Marchand trouvées : ${marchandRecord}`);
            const masterRecord = await this.getMasterByMarchand(marchandRecord.id);
            console.log(`le Master rattaché au Marchand trouvé : ${masterRecord}`);
            const deviseCode = marchandRecord.devise_code?.[0] || 'XOF';
            const pays = marchandRecord.nom_pays?.[0] || '';
            for (const commission of commissions) {
                const typeUtilisateur = commission.fields.typeUtilisateur;
                const pourcentage = commission.fields.pourcentage;
                const part = (montantFrais * pourcentage) / 100;
                let destinataireId = "";
                let description = '';
                switch (typeUtilisateur) {
                    case 'ADMIN':
                        destinataireId = adminRecord.id;
                        description = `${part} ${deviseCode} débité du compte système(${compteSysteme.fields.numCompte}) pour commission sur opération de ${typeOperation} au compte OPERATEUR TECHNIQUE effectuée au ${pays}`;
                        break;
                    case 'TAXE':
                        destinataireId = taxeRecord.id;
                        description = `${part} ${deviseCode} débité du compte système(${compteSysteme.fields.numCompte}) pour commission sur opération de ${typeOperation} au compte du GOUVERNEMENT effectuée au ${pays}`;
                        break;
                    case 'MARCHAND':
                        destinataireId = marchandRecord.id;
                        description = `${part} ${deviseCode} débité du compte système(${compteSysteme.fields.numCompte}) pour commission sur opération de ${typeOperation} au compte du Marchand(${marchandRecord.numero_compte}) effectuée au ${pays}`;
                        break;
                    case 'MASTER':
                        destinataireId = masterRecord.id;
                        description = `${part} ${deviseCode} débité du compte système(${compteSysteme.fields.numCompte}) pour commission sur opération de ${typeOperation} au compte du Master(${masterRecord.numero_compte}) effectuée au ${pays}`;
                        break;
                    default:
                        console.warn(`Type d'utilisateur inconnu : ${typeUtilisateur}`);
                        continue;
                }
                const destinataireRecord = await this.getUserById(destinataireId);
                const nouveauSoldeDestinataire = (destinataireRecord.solde || 0) + part;
                await this.updateSolde(destinataireId, nouveauSoldeDestinataire);
                await this.transactionsService.createCommissionTransaction(part, compteSysteme.id, destinataireId, description);
                console.log(`le compte systeme trouvé : ${compteSysteme.fields.id}`);
                await this.compteSystemeService.debiterCompteSysteme(compteSysteme.fields.id, part);
                console.log(`Part ajoutée au solde de l'acteur : ${typeUtilisateur}, Montant : ${part}`);
            }
        }
        catch (error) {
            console.error(`Erreur lors du partage des commissions : ${error.message}`);
            throw error;
        }
    }
    async shareCommissionsDepot(typeOperation, paysId, montant, marchandNumeroCompte, compteSysteme) {
        try {
            console.log(`Partage des commissions pour l'opération : ${typeOperation}`);
            const commissions = await this.commissionsService.getCommissionsByOperation(typeOperation, paysId);
            console.log(`Les enregistrements récupérés pour l'opération ${typeOperation} du pays ${paysId} : ${commissions}`);
            const marchandRecord = await this.getUserByNumeroCompte(marchandNumeroCompte);
            console.log(`les données du Marchand trouvées : ${marchandRecord}`);
            const deviseCode = marchandRecord.devise_code?.[0] || 'XOF';
            const pays = marchandRecord.nom_pays?.[0] || '';
            for (const commission of commissions) {
                const typeUtilisateur = commission.fields.typeUtilisateur;
                const pourcentage = commission.fields.pourcentage;
                const part = (montant * pourcentage) / 100;
                let destinataireId = "";
                let description = '';
                switch (typeUtilisateur) {
                    case 'MARCHAND':
                        destinataireId = marchandRecord.id;
                        description = `${part} ${deviseCode} débité du compte système (${compteSysteme.fields.numCompte}) pour commission sur opération de ${typeOperation} au Marchand(${marchandRecord.numero_compte}) effectuée au ${pays}`;
                        break;
                    default:
                        console.warn(`Type d'utilisateur inconnu : ${typeUtilisateur}`);
                        continue;
                }
                const destinataireRecord = await this.getUserById(destinataireId);
                const nouveauSoldeDestinataire = (destinataireRecord.solde || 0) + part;
                await this.updateSolde(destinataireId, nouveauSoldeDestinataire);
                await this.transactionsService.createCommissionTransaction(part, compteSysteme.id, destinataireId, description);
                console.log(`le compte systeme trouvé : ${compteSysteme.fields.id}`);
                await this.compteSystemeService.debiterCompteSysteme(compteSysteme.fields.id, part);
                console.log(`Part ajoutée au solde de l'acteur : ${typeUtilisateur}, Montant : ${part}`);
            }
        }
        catch (error) {
            console.error(`Erreur lors du partage des commissions : ${error.message}`);
            throw error;
        }
    }
    async getAdminAccount() {
        try {
            console.log('Recherche du compte ADMIN...');
            const adminRecords = await this.base('Utilisateurs')
                .select({ filterByFormula: `{type_utilisateur} = 'ADMIN'` })
                .firstPage();
            if (adminRecords.length === 0) {
                throw new Error("Aucun compte ADMIN trouvé.");
            }
            console.log(`Compte ADMIN trouvé :`, adminRecords[0]);
            return adminRecords[0];
        }
        catch (error) {
            console.error(`Erreur lors de la recherche du compte ADMIN : ${error.message}`);
            throw error;
        }
    }
    async getTaxeAccount() {
        try {
            console.log('Recherche du compte ADMIN...');
            const taxeRecords = await this.base('Utilisateurs')
                .select({ filterByFormula: `{type_utilisateur} = 'TAXE'` })
                .firstPage();
            if (taxeRecords.length === 0) {
                throw new Error("Aucun compte TAXE trouvé.");
            }
            console.log(`Compte TAXE trouvé :`, taxeRecords[0]);
            return taxeRecords[0];
        }
        catch (error) {
            console.error(`Erreur lors de la recherche du compte ADMIN : ${error.message}`);
            throw error;
        }
    }
    async getMarchandsByMasterId(masterId) {
        try {
            console.log(`Récupération des Marchands pour le Master ID : ${masterId}`);
            const records = await this.base('Utilisateurs').select().all();
            const marchands = records
                .filter((record) => record.fields.type_utilisateur === 'MARCHAND' &&
                record.fields.master_id === masterId)
                .map((record) => {
                const fields = record.fields;
                return { id: record.id, ...fields };
            });
            console.log(`Marchands trouvés pour le Master ID ${masterId} :`, marchands);
            return marchands;
        }
        catch (error) {
            console.error(`Erreur lors de la récupération des Marchands pour le Master ID ${masterId} :`, error.message);
            throw new Error(`Erreur lors de la récupération des Marchands pour le Master ID ${masterId} : ${error.message}`);
        }
    }
    async creditSolde(userId, montant) {
        const userRecords = await this.base('Utilisateurs')
            .select({ filterByFormula: `{id} = '${userId}'` })
            .firstPage();
        if (userRecords.length === 0) {
            throw new Error('Utilisateur introuvable.');
        }
        const userRecord = userRecords[0];
        const currentSolde = userRecord.fields.solde || 0;
        const newSolde = currentSolde + montant;
        await this.base('Utilisateurs').update(userRecord.id, { solde: newSolde });
        return { solde: newSolde };
    }
    async validateOTP(userId, destinataireId, otpCode, montant) {
        const otpRecords = await this.base('OTP')
            .select({
            filterByFormula: `AND({user_id} = '${userId}',{destinataire_id} = '${destinataireId}', {montant} = '${montant}', {code} = '${otpCode}', {used} = 'false')`,
        })
            .firstPage();
        if (otpRecords.length === 0) {
            throw new Error('Code OTP invalide, déjà utilisé ou ne correspond pas à cette opération.');
        }
        const otpRecord = otpRecords[0];
        const expiresAt = new Date(otpRecord.fields.expires_at);
        if (expiresAt < new Date()) {
            throw new Error('Code OTP expiré.');
        }
        await this.base('OTP').update(otpRecord.id, { used: 'true' });
        console.log(`Code OTP validé pour l'utilisateur ID : ${userId}`);
        return true;
    }
    async generateOTP(userId, destinataireId, montant) {
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const operationId = Math.floor(1000000000 + Math.random() * 9000000000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        await this.base('OTP').create([
            {
                fields: {
                    user_id: [userId],
                    destinataire_id: destinataireId,
                    montant: montant,
                    code: otpCode,
                    operation_id: operationId,
                    expires_at: expiresAt.toISOString(),
                },
            },
        ]);
        const user = await this.getUserById(userId);
        const email = user.email;
        await this.mailService.sendOTPEmail(email, otpCode, operationId);
        console.log(`Code OTP généré pour l'utilisateur ID : ${userId}, Opération ID : ${operationId}, Code : ${otpCode}`);
        return otpCode;
    }
    async executerOperation(master_numero_compte, marchand_numero_compte, montant, motif) {
        try {
            console.log('Début de l\'exécution de l\'opération...');
            const masterRecord = await this.getUserByNumeroCompte(master_numero_compte);
            const marchandRecord = await this.getUserByNumeroCompte(marchand_numero_compte);
            console.log('Débit du solde du Master...');
            const newMasterSolde = (masterRecord.solde || 0) - montant;
            await this.updateSolde(masterRecord.id, newMasterSolde);
            console.log('Crédit du solde du Marchand...');
            const newMarchandSolde = (marchandRecord.solde || 0) + montant;
            await this.updateSolde(marchandRecord.id, newMarchandSolde);
            const masterDeviseCode = masterRecord.devise_code?.[0] || 'XOF';
            const marchandDeviseCode = marchandRecord.devise_code?.[0] || 'XOF';
            await this.mailService.sendDebitedEmailDepot(masterRecord.email, masterRecord.nom, marchandRecord.nom, montant, masterDeviseCode, motif);
            await this.mailService.sendCreditedEmail(marchandRecord.email, marchandRecord.nom, masterRecord.nom, montant, marchandDeviseCode, motif);
            console.log('Création de la transaction...');
            const deviseCode = marchandRecord.devise_code?.[0] || 'XOF';
            const description = `Opération d'approvisionnement Marchand. Master(${master_numero_compte}) => Marchand(${marchand_numero_compte}) de ${montant} ${deviseCode}`;
            const transaction = await this.transactionsService.createTransactionAppro({
                type_operation: 'APPROVISIONNEMENT',
                montant,
                expediteur_id: masterRecord.id,
                destinataire_id: marchandRecord.id,
                description,
                motif,
                status: 'SUCCESS',
            });
            const transactionId = transaction.id;
            console.log('Opération exécutée avec succès.');
            return { transaction_id: transactionId, nouveau_solde_master: newMasterSolde, nouveau_solde_marchand: newMarchandSolde };
        }
        catch (error) {
            console.error('Erreur lors de l\'exécution de l\'opération :', error.message);
            throw error;
        }
    }
    async executerOperationDepot(marchand_numero_compte, client_numero_compte, montant, motif) {
        try {
            console.log('Début de l\'exécution de l\'opération...');
            const marchandRecord = await this.getUserByNumeroCompte(marchand_numero_compte);
            const clientRecord = await this.getUserByNumeroCompte(client_numero_compte);
            const type_operation = 'DEPOT';
            const compteSysteme = await this.compteSystemeService.getCompteSystemeByTypeOperation('RETRAIT');
            console.log('Débit du solde du Marchand...');
            const newMarchandSolde = (marchandRecord.solde || 0) - montant;
            await this.updateSolde(marchandRecord.id, newMarchandSolde);
            console.log('Crédit du solde du Client...');
            const newClientSolde = (clientRecord.solde || 0) + montant;
            await this.updateSolde(clientRecord.id, newClientSolde);
            const marchandDeviseCode = marchandRecord.devise_code?.[0] || 'XOF';
            const clientDeviseCode = clientRecord.devise_code?.[0] || 'XOF';
            await this.mailService.sendDebitedEmailDepot(marchandRecord.email, marchandRecord.nom, clientRecord.nom, montant, marchandDeviseCode, motif);
            await this.mailService.sendCreditedEmail(clientRecord.email, clientRecord.nom, marchandRecord.nom, montant, clientDeviseCode, motif);
            console.log('Création de la transaction...');
            const deviseCode = clientRecord.devise_code?.[0] || 'XOF';
            const description = `Opération d'approvisionnement Client. Marchand(${marchand_numero_compte}) => Client(${client_numero_compte}) de ${montant} ${deviseCode}`;
            const transaction = await this.transactionsService.createTransactionAppro({
                type_operation: 'DEPOT',
                montant,
                expediteur_id: marchandRecord.id,
                destinataire_id: clientRecord.id,
                description,
                motif,
                status: 'SUCCESS',
            });
            await this.shareCommissionsDepot(type_operation, clientRecord.pays_id, montant, marchand_numero_compte, compteSysteme);
            const transactionId = transaction.id;
            console.log('Opération exécutée avec succès.');
            return { transaction_id: transactionId, nouveau_solde_marchand: newMarchandSolde, nouveau_solde_client: newClientSolde };
        }
        catch (error) {
            console.error('Erreur lors de l\'exécution de l\'opération :', error.message);
            throw error;
        }
    }
    async executerOperationTransfert(client1_numero_compte, client2_numero_compte, montant, motif) {
        try {
            console.log('Début de l\'exécution de l\'opération...');
            const client1Record = await this.getUserByNumeroCompte(client1_numero_compte);
            const client2Record = await this.getUserByNumeroCompte(client2_numero_compte);
            const type_operation = 'TRANSFERT';
            const fraisTransfert = await this.grilleTarifaireService.getFraisOperation(client1Record.pays_id, type_operation, montant);
            const montantTotal = montant + fraisTransfert;
            console.log('Débit du solde du Marchand...');
            const newClient1Solde = (client1Record.solde || 0) - montantTotal;
            await this.updateSolde(client1Record.id, newClient1Solde);
            console.log('Crédit du solde du Client...');
            const newClient2Solde = (client2Record.solde || 0) + montant;
            await this.updateSolde(client2Record.id, newClient2Solde);
            const marchandDeviseCode = client1Record.devise_code?.[0] || 'XOF';
            const clientDeviseCode = client2Record.devise_code?.[0] || 'XOF';
            await this.mailService.sendDebitedEmail(client1Record.email, client1Record.nom, client2Record.nom, montantTotal, marchandDeviseCode, motif, montant, fraisTransfert);
            await this.mailService.sendCreditedEmail(client2Record.email, client2Record.nom, client1Record.nom, montant, clientDeviseCode, motif);
            const compteSysteme = await this.compteSystemeService.getCompteSystemeByTypeOperation('TRANSFERT');
            await this.compteSystemeService.crediterCompteSysteme(compteSysteme.id, fraisTransfert);
            console.log('Création de la transaction...');
            const deviseCode = client1Record.devise_code?.[0] || 'XOF';
            const description = `Opération de transfert c-to-c . Client(${client1_numero_compte}) => Client(${client2_numero_compte}) de ${montant} ${deviseCode}. Frais = ${fraisTransfert} ${deviseCode}`;
            const transaction = await this.transactionsService.createTransactionAppro({
                type_operation: 'TRANSFERT',
                montant,
                expediteur_id: client1Record.id,
                destinataire_id: client2Record.id,
                description,
                motif,
                frais: fraisTransfert,
                status: 'SUCCESS',
            });
            const transactionId = transaction.id;
            console.log('Opération exécutée avec succès.');
            return { transaction_id: transactionId, nouveau_solde_client1: newClient1Solde, nouveau_solde_client2: newClient2Solde };
        }
        catch (error) {
            console.error('Erreur lors de l\'exécution de l\'opération :', error.message);
            throw error;
        }
    }
    async executerOperationRetrait(client_numero_compte, marchand_numero_compte, montant, motif) {
        try {
            console.log('Début de l\'exécution de l\'opération...');
            const clientRecord = await this.getUserByNumeroCompte(client_numero_compte);
            const marchandRecord = await this.getUserByNumeroCompte(marchand_numero_compte);
            const type_operation = 'RETRAIT';
            const fraisTransfert = await this.grilleTarifaireService.getFraisOperation(clientRecord.pays_id, type_operation, montant);
            const montantTotal = montant + fraisTransfert;
            console.log('Débit du solde du Client...');
            const newClientSolde = (clientRecord.solde || 0) - montantTotal;
            await this.updateSolde(clientRecord.id, newClientSolde);
            console.log('Crédit du solde du Marchand...');
            const newMarchandSolde = (marchandRecord.solde || 0) + montant;
            await this.updateSolde(marchandRecord.id, newMarchandSolde);
            const compteSysteme = await this.compteSystemeService.getCompteSystemeByTypeOperation('RETRAIT');
            await this.compteSystemeService.crediterCompteSysteme(compteSysteme.id, fraisTransfert);
            const marchandDeviseCode = marchandRecord.devise_code?.[0] || 'XOF';
            const clientDeviseCode = clientRecord.devise_code?.[0] || 'XOF';
            await this.mailService.sendDebitedEmail(clientRecord.email, clientRecord.nom, marchandRecord.nom, montantTotal, clientDeviseCode, motif, montant, fraisTransfert);
            await this.mailService.sendCreditedEmail(marchandRecord.email, marchandRecord.nom, clientRecord.nom, montant, marchandDeviseCode, motif);
            console.log('Création de la transaction...');
            const deviseCode = clientRecord.devise_code?.[0] || 'XOF';
            const description = `Opération de retrait client . Client(${client_numero_compte}) => Marchand(${marchand_numero_compte}) de ${montant} ${deviseCode}. Frais = ${fraisTransfert} ${deviseCode} `;
            const transaction = await this.transactionsService.createTransactionAppro({
                type_operation: 'RETRAIT',
                montant,
                expediteur_id: clientRecord.id,
                destinataire_id: marchandRecord.id,
                description,
                motif,
                frais: fraisTransfert,
                status: 'SUCCESS',
            });
            await this.shareCommissions(type_operation, clientRecord.pays_id, fraisTransfert, marchand_numero_compte, compteSysteme);
            const transactionId = transaction.id;
            console.log('Opération exécutée avec succès.');
            return { transaction_id: transactionId, nouveau_solde_client: newClientSolde };
        }
        catch (error) {
            console.error('Erreur lors de l\'exécution de l\'opération :', error.message);
            throw error;
        }
    }
    async exchangeBalance(typeOperation, direction, montant) {
        try {
            console.log(`Échange de soldes entre un compte système et le compte ADMIN...`);
            const adminRecord = await this.getAdminAccount();
            const compteSysteme = await this.compteSystemeService.getCompteSystemeByTypeOperation(typeOperation);
            if (direction === 'SYSTEM_TO_ADMIN') {
                if ((compteSysteme.fields.solde || 0) < montant) {
                    throw new Error(`Solde insuffisant sur le compte système : ${typeOperation}`);
                }
            }
            else if (direction === 'ADMIN_TO_SYSTEM') {
                if ((adminRecord.fields.solde || 0) < montant) {
                    throw new Error(`Solde insuffisant sur le compte ADMIN`);
                }
            }
            if (direction === 'SYSTEM_TO_ADMIN') {
                await this.compteSystemeService.debiterCompteSysteme(compteSysteme.id, montant);
                const nouveauSoldeAdmin = (adminRecord.fields.solde || 0) + montant;
                await this.updateSolde(adminRecord.id, nouveauSoldeAdmin);
            }
            else if (direction === 'ADMIN_TO_SYSTEM') {
                const nouveauSoldeAdmin = (adminRecord.fields.solde || 0) - montant;
                await this.updateSolde(adminRecord.id, nouveauSoldeAdmin);
                await this.compteSystemeService.crediterCompteSysteme(compteSysteme.id, montant);
            }
            const description = direction === 'SYSTEM_TO_ADMIN'
                ? `Transfert de ${montant} du compte système ${typeOperation} vers le compte ADMIN`
                : `Transfert de ${montant} du compte ADMIN vers le compte système ${typeOperation}`;
            const transaction = await this.transactionsService.createTransactionAppro({
                type_operation: 'EXCHANGE',
                montant,
                expediteur_id: direction === 'SYSTEM_TO_ADMIN' ? compteSysteme.id : adminRecord.id,
                destinataire_id: direction === 'SYSTEM_TO_ADMIN' ? adminRecord.id : compteSysteme.id,
                description,
                status: 'SUCCESS',
            });
            const transactionId = transaction.id;
            console.log(`Échange de soldes effectué avec succès. ID opération:${transactionId}`);
        }
        catch (error) {
            console.error(`Erreur lors de l'échange de soldes : ${error.message}`);
            throw error;
        }
    }
    async executerOperationPayment(marchand_numero_compte, client_numero_compte, montant, motif) {
        try {
            console.log('Début de l\'exécution de l\'opération...');
            const marchandRecord = await this.getUserByNumeroCompte(marchand_numero_compte);
            const clientRecord = await this.getUserByNumeroCompte(client_numero_compte);
            console.log('Débit du solde du Client ...');
            const newClientSolde = (clientRecord.solde || 0) - montant;
            await this.updateSolde(clientRecord.id, newClientSolde);
            console.log('Crédit du solde du Marchand_Business...');
            const newMarchandSolde = (marchandRecord.solde || 0) + montant;
            await this.updateSolde(marchandRecord.id, newMarchandSolde);
            const marchandDeviseCode = marchandRecord.devise_code?.[0] || 'XOF';
            const clientDeviseCode = clientRecord.devise_code?.[0] || 'XOF';
            await this.mailService.sendDebitedEmailDepot(clientRecord.email, clientRecord.nom, marchandRecord.nom, montant, clientDeviseCode, motif);
            await this.mailService.sendCreditedEmail(marchandRecord.email, marchandRecord.nom, clientRecord.nom, montant, marchandDeviseCode, motif);
            console.log('Création de la transaction...');
            const deviseCode = clientRecord.devise_code?.[0] || 'XOF';
            const description = `Opération de paiement Marchand. Client(${client_numero_compte}) => Marchand_Business(${marchand_numero_compte}) de ${montant} ${deviseCode}`;
            const transaction = await this.transactionsService.createTransactionAppro({
                type_operation: 'PAIEMENT',
                montant,
                expediteur_id: clientRecord.id,
                destinataire_id: marchandRecord.id,
                description,
                motif,
                status: 'SUCCESS',
            });
            const transactionId = transaction.id;
            console.log('Opération exécutée avec succès.');
            return { transaction_id: transactionId, nouveau_solde_marchand: newMarchandSolde, nouveau_solde_client: newClientSolde };
        }
        catch (error) {
            console.error('Erreur lors de l\'exécution de l\'opération :', error.message);
            throw error;
        }
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mail_service_1.MailService,
        grille_tarifaire_service_1.GrilleTarifaireService,
        compte_systeme_service_1.CompteSystemeService,
        commissionnement_service_1.CommissionnementService,
        transactions_service_1.TransactionsService])
], UsersService);
//# sourceMappingURL=users.service.js.map