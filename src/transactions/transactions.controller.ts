// src/transactions/transactions.controller.ts
import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { MasterGuard } from '../auth/master.guard';
import { AdminGuard } from '../auth/admin.guard';
import { MarchandGuard } from '../auth/marchand.guard';
import { ClientGuard } from '../auth/client.guard';
import { CodesRechargeService } from '../codes-recharge/codes-recharge.service';
import {UsersService } from '../users/users.service';
import { TransactionsService } from './transactions.service';
import {GrilleTarifaireService } from '../grille-tarifaire/grille-tarifaire.service';


@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly codesRechargeService: CodesRechargeService,
    private readonly usersService: UsersService,
    private readonly grilleTarifaireService: GrilleTarifaireService,
    private readonly transactionsService: TransactionsService,
  ) {}

    @Get()
    @UseGuards(AdminGuard)
    async getAllTransaction() {
      return this.transactionsService.getAllTransaction();
    }

  // Endpoint pour recharger le compte d'un Master avec un code de recharge
  @Post('recharge')
  @UseGuards(MasterGuard)
async rechargeCompte(@Body() rechargeData: { master_id: string; code: string }) {
  const { master_id, code } = rechargeData;

  try {
    // Vérifier que l'utilisateur est de type Master
    const masterRecords = await this.usersService.getUserById(master_id);
    const userType = masterRecords.type_utilisateur;

    if (userType !== 'MASTER') {
      throw new Error('L\'utilisateur spécifié n\'est pas de type Master.');
    }

    // Valider et utiliser le code de recharge
    const { montant } = await this.codesRechargeService.useCodeRecharge(master_id, code);

    // Créditer le solde du Master
    const { solde } = await this.usersService.creditSolde(master_id, montant);

    // Récupérer l'ID d'enregistrement du code de recharge
    const codeRechargeId = await this.codesRechargeService.getCodeRechargeIdByCode(code);

    // Enregistrer la transaction avec l'ID d'enregistrement correct
    await this.transactionsService.createTransaction({
      type_operation: 'RECHARGE',
      description: 'RECHARGEMENT DE COMPTE',
      montant,
      //date_transaction: new Date().toISOString(),
      utilisateur_id: master_id,
      code_recharge_id: codeRechargeId, // Utiliser l'ID d'enregistrement
      status: 'SUCCESS',
    });

    return { message: 'Rechargement effectué avec succès.', nouveau_solde: solde };
  } catch (error) {
    throw error;
  }
}  
   //endpoint permettant à un Master d'approvisionner le compte d'un Marchand.
    @Post('approvisionnement')
    @UseGuards(MasterGuard)
    async approvisionnerMarchand(@Body() approvisionnementData: { master_numero_compte: string; marchand_numero_compte: string; montant: number; motif: string; pin: string }) {
      const { master_numero_compte, marchand_numero_compte, montant, motif, pin } = approvisionnementData;
    
      try {
        console.log('Données reçues :', approvisionnementData);
    
        // Récupérer les enregistrements du Master et du Marchand
        console.log('Récupération des données du Master...');
        const masterRecord = await this.usersService.getUserByNumeroCompte(master_numero_compte);
        console.log('Master trouvé :', masterRecord);
    
        console.log('Récupération des données du Marchand...');
        const marchandRecord = await this.usersService.getUserByNumeroCompte(marchand_numero_compte);
        console.log('Marchand trouvé :', marchandRecord);
  
        // Vérifier que le Master est de type "MASTER"
        console.log('Vérification du type utilisateur (Master)...');
        await this.usersService.validateUserType(masterRecord.id, 'MASTER');
    
        // Vérifier que le Marchand est de type "MARCHAND"
        console.log('Vérification du type utilisateur (Marchand)...');
        await this.usersService.validateUserType(marchandRecord.id, 'MARCHAND');
  
        // Vérifier que le pays du Master est "Activated"
        console.log('Vérification du statut du Master...');
        await this.usersService.checkCountryStatusForUser(masterRecord.id);
  
        // Vérifier que le statut du Master est "Activated"
        console.log('Vérification du statut du Master...');
        await this.usersService.checkUserStatusMaster(master_numero_compte);
  
        // Vérifier que le pays du Marchand est "Activated"
        console.log('Vérification du statut du Marchand...');
        await this.usersService.checkCountryStatusForMarchand(marchandRecord.id);
  
        // Vérifier que le statut du Marchand est "Activated"
        console.log('Vérification du statut du Marchand...');
        await this.usersService.checkUserStatusMarchand(marchand_numero_compte);
  
          // Vérifier que le Marchand est rattaché au Master
          console.log('Vérification du rattachement Master-Marchand...');
          const marchandsDuMaster = await this.usersService.getMarchandsByMaster(masterRecord.id);
          const isMarchandRattache = marchandsDuMaster.some((marchand) => marchand.id === marchandRecord.id);
      
          if (!isMarchandRattache) {
            console.log('Ce Marchand n/est pas rattaché à ce Master.');
            throw new Error("Ce Marchand n'est pas rattaché à ce Master.");
          }

        // Vérifier que le solde du Master est suffisant
        console.log('Vérification du solde du Master...');
        await this.usersService.validateSolde(masterRecord.id, montant);
    
        // Vérifier le code PIN du Master
        console.log('Vérification du code PIN du Master...');
        await this.usersService.validatePIN(master_numero_compte, pin); // Appel à la méthode validatePIN

      // Générer un code OTP pour valider l'opération
      console.log('Génération du code OTP...');
      return this.usersService.generateOTP(masterRecord.id, marchandRecord.id, montant);

    //return { message: 'Un code OTP a été envoyé à votre adresse e-mail. Veuillez le saisir pour valider l\'opération.' };
      } catch (error) {
        console.error('Erreur interceptée :', error.message);
        throw error;
      }
  }
  // enpoint pour valider l'opération d'approvisionnement
  @Post('valider-appro')
  @UseGuards(MasterGuard)
  async validerOperation(@Body() validationData: { master_numero_compte: string; marchand_numero_compte: string; montant: number; motif: string; otpCode: string}) {
    const { master_numero_compte, marchand_numero_compte, montant, motif, otpCode } = validationData;

  try {
    console.log('Données reçues pour la validation :', validationData);

    // Récupérer l'utilisateur Master
    console.log('Récupération des données du Master...');
    const masterRecord = await this.usersService.getUserByNumeroCompte(master_numero_compte);
    console.log('Master trouvé :', masterRecord);

    // Vérifier que le statut du Master est "Activated"
    console.log('Vérification du statut du Master...');
    await this.usersService.checkUserStatus(master_numero_compte);

    // Récupérer l'utilisateur Marchand
    console.log('Récupération des données du Marchand...');
    const marchandRecord = await this.usersService.getUserByNumeroCompte(marchand_numero_compte);
    console.log('Marchand trouvé :', marchandRecord);

    // Vérifier que le statut du Marchand est "Activated"
    console.log('Vérification du statut du Marchand...');
    await this.usersService.checkUserStatus(marchand_numero_compte);

    // Valider le code OTP
    console.log('Validation du code OTP...');
    await this.usersService.validateOTP(masterRecord.id, marchandRecord.id, otpCode, montant);

      console.log('Exécution de l\'opération...');
      const resultat = await this.usersService.executerOperation(
        master_numero_compte,
        marchand_numero_compte,
        montant,
        motif
      );

    //return { message: 'Validation réussie. L\'opération peut être exécutée.' };
    return { message: 'Opération exécutée avec succès.', ...resultat };

  } catch (error) {
    console.error('Erreur lors de la validation ou de l\'exécution de l\'opération :', error.message);
    throw error;
  }
}

   //endpoint permettant à un Marchand d'approvisionner le compte d'un Client.
   @Post('depot')
   @UseGuards(MarchandGuard)
   async approvisionnerClient(@Body() approvisionnementData: { client_numero_compte: string; marchand_numero_compte: string; montant: number; motif: string; pin: string }) {
     const { client_numero_compte, marchand_numero_compte, montant, motif, pin } = approvisionnementData;
   
     try {
       console.log('Données reçues :', approvisionnementData);

    // Vérifier que les comptes à débiter et à créditer sont différents
    await this.usersService.validateDifferentAccounts(marchand_numero_compte, client_numero_compte);

       // Récupérer les enregistrements du Marchand et du Client
       console.log('Récupération des données du Client...');
       const clientRecord = await this.usersService.getUserByNumeroCompte(client_numero_compte);
       console.log('Client trouvé :', clientRecord);
   
       console.log('Récupération des données du Marchand...');
       const marchandRecord = await this.usersService.getUserByNumeroCompte(marchand_numero_compte);
       console.log('Marchand trouvé :', marchandRecord);

      // Vérifier que les deux comptes sont du même pays
      await this.usersService.validateSameCountry(marchand_numero_compte, client_numero_compte);
 
       // Vérifier que le Client est de type "CLIENT"
       console.log('Vérification du type utilisateur (Client)...');
       await this.usersService.validateUserType(clientRecord.id, 'CLIENT');
   
       // Vérifier que le Marchand est de type "MARCHAND"
       console.log('Vérification du type utilisateur (Marchand)...');
       await this.usersService.validateUserType(marchandRecord.id, 'MARCHAND');
 
       // Vérifier que le pays du Client est "Activated"
       console.log('Vérification du statut du Client...');
       await this.usersService.checkCountryStatusForUser(clientRecord.id);
 
       // Vérifier que le statut du Client est "Activated"
       console.log('Vérification du statut du Client...');
       await this.usersService.checkUserStatus(client_numero_compte);
 
       // Vérifier que le pays du Marchand est "Activated"
       console.log('Vérification du statut du Marchand...');
       await this.usersService.checkCountryStatusForMarchand(marchandRecord.id);
 
       // Vérifier que le statut du Marchand est "Activated"
       console.log('Vérification du statut du Marchand...');
       await this.usersService.checkUserStatusMarchand(marchand_numero_compte);
 
       // Vérifier que le solde du Marchand est suffisant
       console.log('Vérification du solde du Marchand...');
       await this.usersService.validateSolde(marchandRecord.id, montant);
   
       // Vérifier le code PIN du Marchand
       console.log('Vérification du code PIN du Master...');
       await this.usersService.validatePIN(marchand_numero_compte, pin);

     // Générer un code OTP pour valider l'opération
     console.log('Génération du code OTP...');
     return this.usersService.generateOTP(marchandRecord.id, clientRecord.id, montant);

       //return { message: 'Un code OTP a été envoyé à votre adresse e-mail. Veuillez le saisir pour valider l\'opération.' };
     } catch (error) {
       console.error('Erreur interceptée :', error.message);
       throw error;;
     }
 }
  // enpoint pour valider l'opération de dépot
  @Post('valider-depot')
  @UseGuards(MarchandGuard)
  async validerDepot(@Body() validationData: { client_numero_compte: string; marchand_numero_compte: string; montant: number; motif: string; otpCode: string}) {
    const { client_numero_compte, marchand_numero_compte, montant, motif, otpCode} = validationData;

  try {
    console.log('Données reçues pour la validation :', validationData);

    // Récupérer l'utilisateur Client
    console.log('Récupération des données du Client...');
    const clientRecord = await this.usersService.getUserByNumeroCompte(client_numero_compte);
    console.log('Client trouvé :', clientRecord);

    // Vérifier que le statut du Client est "Activated"
    console.log('Vérification du statut du Client...');
    await this.usersService.checkUserStatus(client_numero_compte);

    // Récupérer l'utilisateur Marchand
    console.log('Récupération des données du Marchand...');
    const marchandRecord = await this.usersService.getUserByNumeroCompte(marchand_numero_compte);
    console.log('Marchand trouvé :', marchandRecord);

    // Vérifier que le statut du Marchand est "Activated"
    console.log('Vérification du statut du Marchand...');
    await this.usersService.checkUserStatus(marchand_numero_compte);

    // Valider le code OTP
    console.log('Validation du code OTP...');
    await this.usersService.validateOTP(marchandRecord.id, clientRecord.id, otpCode, montant);

      console.log('Exécution de l\'opération...');
      const resultat = await this.usersService.executerOperationDepot(
        marchand_numero_compte,
        client_numero_compte,
        montant,
        motif
      );

    //return { message: 'Validation réussie. L\'opération peut être exécutée.' };
    return { message: 'Opération exécutée avec succès.', ...resultat };

  } catch (error) {
    console.error('Erreur lors de la validation ou de l\'exécution de l\'opération :', error.message);
    throw error;
  }
}
   //endpoint permettant à un Marchand d'approvisionner le compte d'un Client à l'international.
   @Post('depot-inter')
   @UseGuards(MarchandGuard)
   async approvisionnerClientinter(@Body() approvisionnementData: { client_numero_compte: string; marchand_numero_compte: string; montant: number; motif: string; pin: string }) {
     const { client_numero_compte, marchand_numero_compte, montant, motif, pin } = approvisionnementData;
   
     try {
       console.log('Données reçues :', approvisionnementData);

    // Vérifier que les comptes à débiter et à créditer sont différents
    await this.usersService.validateDifferentAccounts(marchand_numero_compte, client_numero_compte);

       // Récupérer les enregistrements du Marchand et du Client
       console.log('Récupération des données du Client...');
       const clientRecord = await this.usersService.getUserByNumeroCompte(client_numero_compte);
       console.log('Client trouvé :', clientRecord);
   
       console.log('Récupération des données du Marchand...');
       const marchandRecord = await this.usersService.getUserByNumeroCompte(marchand_numero_compte);
       console.log('Marchand trouvé :', marchandRecord);

      // Vérifier que les deux comptes ne sont pas du même pays
      await this.usersService.validateNotSameCountry(marchand_numero_compte, client_numero_compte);
 
       // Vérifier que le Client est de type "CLIENT"
       console.log('Vérification du type utilisateur (Client)...');
       await this.usersService.validateUserType(clientRecord.id, 'CLIENT');
   
       // Vérifier que le Marchand est de type "MARCHAND"
       console.log('Vérification du type utilisateur (Marchand)...');
       await this.usersService.validateUserType(marchandRecord.id, 'MARCHAND');
 
       // Vérifier que le pays du Client est "Activated"
       console.log('Vérification du statut du Client...');
       await this.usersService.checkCountryStatusForUser(clientRecord.id);
 
       // Vérifier que le statut du Client est "Activated"
       console.log('Vérification du statut du Client...');
       await this.usersService.checkUserStatus(client_numero_compte);
 
       // Vérifier que le pays du Marchand est "Activated"
       console.log('Vérification du statut du Marchand...');
       await this.usersService.checkCountryStatusForMarchand(marchandRecord.id);
 
       // Vérifier que le statut du Marchand est "Activated"
       console.log('Vérification du statut du Marchand...');
       await this.usersService.checkUserStatusMarchand(marchand_numero_compte);
 
      // Calculer les frais de transfert
    const pays_id = marchandRecord.pays_id?.[0]; // Récupérer l'ID du pays du Client 1
    const type_operation = 'DEPOT_INTER';
    const fraisTransfert = await this.grilleTarifaireService.getFraisOperation(pays_id, type_operation, montant); // Récupérer les frais
    const montantTotal = montant + fraisTransfert;

       // Vérifier que le solde du Marchand est suffisant
       console.log('Vérification du solde du Marchand...');
       await this.usersService.validateSolde(marchandRecord.id, montantTotal);
   
       // Vérifier le code PIN du Marchand
       console.log('Vérification du code PIN du Master...');
       await this.usersService.validatePIN(marchand_numero_compte, pin);

     // Générer un code OTP pour valider l'opération
     console.log('Génération du code OTP...');
     return this.usersService.generateOTP(marchandRecord.id, clientRecord.id, montant);

       //return { message: 'Un code OTP a été envoyé à votre adresse e-mail. Veuillez le saisir pour valider l\'opération.' };
     } catch (error) {
       console.error('Erreur interceptée :', error.message);
       throw error;;
     }
 }

  // enpoint pour valider l'opération de dépot
  @Post('valider-depot-inter')
  @UseGuards(MarchandGuard)
  async validerDepotInter(@Body() validationData: { client_numero_compte: string; marchand_numero_compte: string; montant: number; motif: string; otpCode: string}) {
    const { client_numero_compte, marchand_numero_compte, montant, motif, otpCode} = validationData;

  try {
    console.log('Données reçues pour la validation :', validationData);

    // Récupérer l'utilisateur Client
    console.log('Récupération des données du Client...');
    const clientRecord = await this.usersService.getUserByNumeroCompte(client_numero_compte);
    console.log('Client trouvé :', clientRecord);

    // Vérifier que le statut du Client est "Activated"
    console.log('Vérification du statut du Client...');
    await this.usersService.checkUserStatus(client_numero_compte);

    // Récupérer l'utilisateur Marchand
    console.log('Récupération des données du Marchand...');
    const marchandRecord = await this.usersService.getUserByNumeroCompte(marchand_numero_compte);
    console.log('Marchand trouvé :', marchandRecord);

    // Vérifier que le statut du Marchand est "Activated"
    console.log('Vérification du statut du Marchand...');
    await this.usersService.checkUserStatus(marchand_numero_compte);

    // Valider le code OTP
    console.log('Validation du code OTP...');
    await this.usersService.validateOTP(marchandRecord.id, clientRecord.id, otpCode, montant);

      console.log('Exécution de l\'opération...');
      const resultat = await this.usersService.executerOperationDepotInter(
        marchand_numero_compte,
        client_numero_compte,
        montant,
        motif
      );

    //return { message: 'Validation réussie. L\'opération peut être exécutée.' };
    return { message: 'Opération exécutée avec succès.', ...resultat };

  } catch (error) {
    console.error('Erreur lors de la validation ou de l\'exécution de l\'opération :', error.message);
    throw error;
  }
}

// Transfert c-to-c (Client à Client)
@Post('transfert')
@UseGuards(ClientGuard)
async transfert(@Body() transfertData: { client1_numero_compte: string; client2_numero_compte: string; montant: number; motif: string; pin: string }) {
  const { client1_numero_compte, client2_numero_compte, montant, motif, pin } = transfertData;

  try {
    console.log('Données reçues pour le transfert :', transfertData);

    // Vérifier que les comptes à débiter et à créditer sont différents
    await this.usersService.validateDifferentAccounts(client1_numero_compte, client2_numero_compte);

    // Récupérer les enregistrements des Clients
       console.log('Récupération des données du Client1...');
       const client1Record = await this.usersService.getUserByNumeroCompte(client1_numero_compte);
       console.log('Client 1 trouvé :', client1Record);
   
       console.log('Récupération des données du Client2...');
       const client2Record = await this.usersService.getUserByNumeroCompte(client2_numero_compte);
       console.log('client 2 trouvé :', client2Record);

      // Vérifier que les deux comptes sont du même pays
      await this.usersService.validateSameCountry(client1_numero_compte, client2_numero_compte);
 
       // Vérifier que le Client 1 est de type "CLIENT"
       console.log('Vérification du type utilisateur (Client 1)...');
       await this.usersService.validateUserType(client1Record.id, 'CLIENT');
   
       // Vérifier que le Client 2 est de type "CLIENT"
       console.log('Vérification du type utilisateur (Client 2)...');
       await this.usersService.validateUserType(client2Record.id, 'CLIENT');
 
       // Vérifier que le pays du Client 1 est "Activated"
       console.log('Vérification du statut du Client 1...');
       await this.usersService.checkCountryStatusForUser(client1Record.id);
 
       // Vérifier que le statut du Client 1 est "Activated"
       console.log('Vérification du statut du Client 1...');
       await this.usersService.checkUserStatus(client1_numero_compte);
 
       // Vérifier que le pays du Client 2 est "Activated"
       console.log('Vérification du statut du Client 2...');
       await this.usersService.checkCountryStatusForUser(client2Record.id);
 
       // Vérifier que le statut du Client 2 est "Activated"
       console.log('Vérification du statut du Client 2...');
       await this.usersService.checkUserStatus(client2_numero_compte);

    // Calculer les frais de transfert
    const pays_id = client1Record.pays_id?.[0]; // Récupérer l'ID du pays du Client 1
    const type_operation = 'TRANSFERT';
    const fraisTransfert = await this.grilleTarifaireService.getFraisOperation(pays_id, type_operation, montant); // Récupérer les frais
    const montantTotal = montant + fraisTransfert;

    // Vérifier que le solde du Client 1 est suffisant
    await this.usersService.validateSolde(client1Record.id, montantTotal);

    // Vérifier le code PIN du Client 1
    await this.usersService.validatePIN(client1_numero_compte, pin);

  // Générer un code OTP pour valider l'opération
  console.log('Génération du code OTP...');
  return this.usersService.generateOTP(client1Record.id, client2Record.id, montant);

    //return { message: 'Un code OTP a été envoyé à votre adresse e-mail. Veuillez le saisir pour valider l\'opération.' };
  } catch (error) {
    console.error('Erreur interceptée :', error.message);
    throw error;
  }
}

  // enpoint pour valider l'opération de transfert
  @Post('valider-transfert')
  @UseGuards(ClientGuard)
  async validerTransfert(@Body() validationData: { client1_numero_compte: string; client2_numero_compte: string; montant: number; motif: string; otpCode: string}) {
    const { client1_numero_compte, client2_numero_compte, montant, motif, otpCode } = validationData;

  try {
    console.log('Données reçues pour la validation :', validationData);

    // Récupérer l'utilisateur Client 1
    console.log('Récupération des données du Client 1...');
    const client1Record = await this.usersService.getUserByNumeroCompte(client1_numero_compte);
    console.log('Client trouvé :', client1Record);

    // Vérifier que le statut du Client 1 est "Activated"
    console.log('Vérification du statut du Client...');
    await this.usersService.checkUserStatus(client1_numero_compte);

    // Récupérer l'utilisateur Client 2
    console.log('Récupération des données du Marchand...');
    const client2Record = await this.usersService.getUserByNumeroCompte(client2_numero_compte);
    console.log('Marchand trouvé :', client2Record);

    // Vérifier que le statut du Marchand est "Activated"
    console.log('Vérification du statut du Marchand...');
    await this.usersService.checkUserStatus(client2_numero_compte);

      // Calculer les frais de transfert
      const pays_id = client1Record.pays_id?.[0]; // Récupérer l'ID du pays du Client 1
      const type_operation = 'TRANSFERT';
      const fraisTransfert = await this.grilleTarifaireService.getFraisOperation(pays_id, type_operation, montant); // Récupérer les frais
      const montantTotal = montant + fraisTransfert;

    // Valider le code OTP
    console.log('Validation du code OTP...');
    await this.usersService.validateOTP(client1Record.id, client2Record.id, otpCode, montant);

      console.log('Exécution de l\'opération...');
      const resultat = await this.usersService.executerOperationTransfert(
        client1_numero_compte,
        client2_numero_compte,
        montant,
        motif
      );

    //return { message: 'Validation réussie. L\'opération peut être exécutée.' };
    return { message: 'Opération exécutée avec succès.', ...resultat };

  } catch (error) {
    console.error('Erreur lors de la validation ou de l\'exécution de l\'opération :', error.message);
    throw error;
  }
}

// Transfert M-to-M (Marchand à Marchand)
@Post('transfert-inter')
@UseGuards(MarchandGuard)
async transfertInter(@Body() transfertData: { client1_numero_compte: string; client2_numero_compte: string; montant: number; motif: string; pin: string, nom: string, prenoms: string, address: string, phone: string, email: string }) {
  const { client1_numero_compte, client2_numero_compte, montant, motif, pin, nom, prenoms, address, phone, email } = transfertData;

  try {
    console.log('Données reçues pour le transfert :', transfertData);

    // Vérifier que les comptes à débiter et à créditer sont différents
    await this.usersService.validateDifferentAccounts(client1_numero_compte, client2_numero_compte);

    // Récupérer les enregistrements des Clients
       console.log('Récupération des données du Client1...');
       const client1Record = await this.usersService.getUserByNumeroCompte(client1_numero_compte);
       console.log('Client 1 trouvé :', client1Record);
   
       console.log('Récupération des données du Client2...');
       const client2Record = await this.usersService.getUserByNumeroCompte(client2_numero_compte);
       console.log('client 2 trouvé :', client2Record);

      // Vérifier que les deux comptes ne sont pas du même pays
      await this.usersService.validateNotSameCountry(client1_numero_compte, client2_numero_compte);
 
       // Vérifier que le Client 1 est de type "MARCHAND"
       console.log('Vérification du type utilisateur (Client 1)...');
       await this.usersService.validateUserType(client1Record.id, 'MARCHAND');
   
       // Vérifier que le Client 2 est de type "MARCHAND"
       console.log('Vérification du type utilisateur (Client 2)...');
       await this.usersService.validateUserType(client2Record.id, 'MARCHAND');
 
       // Vérifier que le pays du Client 1 est "Activated"
       console.log('Vérification du statut du Client 1...');
       await this.usersService.checkCountryStatusForUser(client1Record.id);
 
       // Vérifier que le statut du Client 1 est "Activated"
       console.log('Vérification du statut du Client 1...');
       await this.usersService.checkUserStatus(client1_numero_compte);
 
       // Vérifier que le pays du Client 2 est "Activated"
       console.log('Vérification du statut du Client 2...');
       await this.usersService.checkCountryStatusForUser(client2Record.id);
 
       // Vérifier que le statut du Client 2 est "Activated"
       console.log('Vérification du statut du Client 2...');
       await this.usersService.checkUserStatus(client2_numero_compte);

    // Calculer les frais de transfert
    const pays_id = client2Record.pays_id?.[0]; // Récupérer l'ID du pays du Client 1
    const type_operation = 'TRANSFERT_INTER';
    const fraisTransfert = await this.grilleTarifaireService.getFraisOperation(pays_id, type_operation, montant); // Récupérer les frais
    const montantTotal = montant + fraisTransfert;

    // Vérifier que le solde du Client 1 est suffisant
    await this.usersService.validateSolde(client1Record.id, montantTotal);

    // Vérifier le code PIN du Client 1
    await this.usersService.validatePIN(client1_numero_compte, pin);

  // Générer un code OTP pour valider l'opération
  console.log('Génération du code OTP...');
  return this.usersService.generateOTPInter(client1Record.id, client2Record.id, montant, nom, prenoms, address, phone, email);

    //return { message: 'Un code OTP a été envoyé à votre adresse e-mail. Veuillez le saisir pour valider l\'opération.' };
  } catch (error) {
    console.error('Erreur interceptée :', error.message);
    throw error;
  }
}

 //endpoint permettant à un Client d'effectuer un retarit auprès d'un. 
 @Post('retrait')
 @UseGuards(MarchandGuard)
 async retraitClient(@Body() approvisionnementData: { marchand_numero_compte: string; client_numero_compte: string; montant: number; pin: string }) {
   const { marchand_numero_compte, client_numero_compte, montant, pin } = approvisionnementData;
 
   try {
     console.log('Données reçues :', approvisionnementData);

  // Vérifier que les comptes à débiter et à créditer sont différents
  await this.usersService.validateDifferentAccounts(marchand_numero_compte, client_numero_compte);

     // Récupérer les enregistrements du Marchand et du Client
     console.log('Récupération des données du Client...');
     const clientRecord = await this.usersService.getUserByNumeroCompte(client_numero_compte);
     console.log('Client trouvé :', clientRecord);
 
     console.log('Récupération des données du Marchand...');
     const marchandRecord = await this.usersService.getUserByNumeroCompte(marchand_numero_compte);
     console.log('Marchand trouvé :', marchandRecord);

    // Vérifier que les deux comptes sont du même pays
    await this.usersService.validateSameCountry(marchand_numero_compte, client_numero_compte);

     // Vérifier que le Client est de type "CLIENT"
     console.log('Vérification du type utilisateur (Client)...');
     await this.usersService.validateUserType(clientRecord.id, 'CLIENT');
 
     // Vérifier que le Marchand est de type "MARCHAND"
     console.log('Vérification du type utilisateur (Marchand)...');
     await this.usersService.validateUserType(marchandRecord.id, 'MARCHAND');

     // Vérifier que le pays du Client est "Activated"
     console.log('Vérification du statut du Client...');
     await this.usersService.checkCountryStatusForUser(clientRecord.id);

     // Vérifier que le statut du Client est "Activated"
     console.log('Vérification du statut du Client...');
     await this.usersService.checkUserStatus(client_numero_compte);

     // Vérifier que le pays du Marchand est "Activated"
     console.log('Vérification du statut du Marchand...');
     await this.usersService.checkCountryStatusForMarchand(marchandRecord.id);

     // Vérifier que le statut du Marchand est "Activated"
     console.log('Vérification du statut du Marchand...');
     await this.usersService.checkUserStatusMarchand(marchand_numero_compte);

    // Calculer les frais de transfert
    const pays_id = clientRecord.pays_id?.[0]; // Récupérer l'ID du pays du Client 1
    const type_operation = 'RETRAIT';
    const fraisTransfert = await this.grilleTarifaireService.getFraisOperation(pays_id, type_operation, montant); // Récupérer les frais
    const montantTotal = montant + fraisTransfert;

     // Vérifier que le solde du Marchand est suffisant
     console.log('Vérification du solde du Marchand...');
     await this.usersService.validateSolde(clientRecord.id, montantTotal);
 
     // Vérifier le code PIN du Marchand
     console.log('Vérification du code PIN du Master...');
     await this.usersService.validatePIN(client_numero_compte, pin);

   // Générer un code OTP pour valider l'opération
   console.log('Génération du code OTP...');
   return this.usersService.generateOTP(clientRecord.id, marchandRecord.id, montant);

    //return { message: 'Un code OTP a été envoyé à votre adresse e-mail. Veuillez le saisir pour valider l\'opération.' };
   } catch (error) {
     console.error('Erreur interceptée :', error.message);
     throw error;
   }
}

  // enpoint pour valider l'opération de retrait
  @Post('valider-retrait')
  @UseGuards(MarchandGuard)
  async validerRetrait(@Body() validationData: { client_numero_compte: string; marchand_numero_compte: string; montant: number; motif: string; otpCode: string }) {
    const { client_numero_compte, marchand_numero_compte, montant, motif, otpCode } = validationData;

  try {
    console.log('Données reçues pour la validation :', validationData);

    // Récupérer l'utilisateur Client 
    console.log('Récupération des données du Client 1...');
    const clientRecord = await this.usersService.getUserByNumeroCompte(client_numero_compte);
    console.log('Client trouvé :', clientRecord);

    // Vérifier que le statut du Client est "Activated"
    console.log('Vérification du statut du Client...');
    await this.usersService.checkUserStatus(client_numero_compte);

    // Récupérer l'utilisateur Marchand
    console.log('Récupération des données du Marchand...');
    const marchandRecord = await this.usersService.getUserByNumeroCompte(marchand_numero_compte);
    console.log('Marchand trouvé :', marchandRecord);

    // Vérifier que le statut du Marchand est "Activated"
    console.log('Vérification du statut du Marchand...');
    await this.usersService.checkUserStatus(marchand_numero_compte);

    // Valider le code OTP
    console.log('Validation du code OTP...');
    await this.usersService.validateOTP(clientRecord.id, marchandRecord.id, otpCode, montant);

      console.log('Exécution de l\'opération...');
      const resultat = await this.usersService.executerOperationRetrait(
        client_numero_compte,
        marchand_numero_compte,
        montant,
        motif
      );

    //return { message: 'Validation réussie. L\'opération peut être exécutée.' };
    return { message: 'Opération exécutée avec succès.', ...resultat };

  } catch (error) {
    console.error('Erreur lors de la validation ou de l\'exécution de l\'opération :', error.message);
    throw error;
  }
}

// endpoint pour déclencher l'échange de soldes.
@Post('exchange-balance')
@UseGuards(AdminGuard)
async exchangeBalance(@Body() exchangeData: { typeOperation: string; direction: 'SYSTEM_TO_ADMIN' | 'ADMIN_TO_SYSTEM'; montant: number }) {
  const { typeOperation, direction, montant } = exchangeData;

  try {
    console.log('Données reçues pour l\'échange de soldes :', exchangeData);

    // Appeler le service pour effectuer l'échange
    await this.usersService.exchangeBalance(typeOperation, direction, montant);

    return { message: 'Échange de soldes effectué avec succès.' };
  } catch (error) {
    console.error('Erreur lors de l\'échange de soldes :', error.message);
    throw error;
  }
}

   //endpoint permettant à un Client de payer un Marchand.
   @Post('payment')
   //@UseGuards(ClientGuard)
   async payment(@Body() approvisionnementData: { client_numero_compte: string; marchand_numero_compte: string; montant: number; motif: string; pin: string }) {
     const { client_numero_compte, marchand_numero_compte, montant, motif, pin } = approvisionnementData;
   
     try {
       console.log('Données reçues :', approvisionnementData);

    // Vérifier que les comptes à débiter et à créditer sont différents
    await this.usersService.validateDifferentAccounts(marchand_numero_compte, client_numero_compte);

       // Récupérer les enregistrements du Marchand et du Client
       console.log('Récupération des données du Client...');
       const clientRecord = await this.usersService.getUserByNumeroCompte(client_numero_compte);
       console.log('Client trouvé :', clientRecord);
   
       console.log('Récupération des données du Marchand_Business...');
       const marchandRecord = await this.usersService.getUserByNumeroCompte(marchand_numero_compte);
       console.log('Marchand_Business trouvé :', marchandRecord);

      // Vérifier que les deux comptes sont du même pays
      //await this.usersService.validateSameCountry(marchand_numero_compte, client_numero_compte);
 
       // Vérifier que le Client est de type "CLIENT"
       console.log('Vérification du type utilisateur (Client)...');
       await this.usersService.validateUserType(clientRecord.id, 'CLIENT');
   
       // Vérifier que le Marchand est de type "MARCHAND"
       console.log('Vérification du type utilisateur (Marchand_Business)...');
       await this.usersService.validateUserType(marchandRecord.id, 'BUSINESS');
 
       // Vérifier que le pays du Client est "Activated"
       console.log('Vérification du statut du Client...');
       await this.usersService.checkCountryStatusForUser(clientRecord.id);
 
       // Vérifier que le statut du Client est "Activated"
       console.log('Vérification du statut du Client...');
       await this.usersService.checkUserStatus(client_numero_compte);
 
       // Vérifier que le pays du Marchand_Business est "Activated"
       console.log('Vérification du statut du Marchand_Business...');
       await this.usersService.checkCountryStatusForMarchand(marchandRecord.id);
 
       // Vérifier que le statut du Marchand est "Activated"
       console.log('Vérification du statut du Marchand...');
       await this.usersService.checkUserStatusMarchand(marchand_numero_compte);
 
       // Vérifier que le solde du Client est suffisant
       console.log('Vérification du solde du Client...');
       await this.usersService.validateSolde(clientRecord.id, montant);
   
       // Vérifier le code PIN du Client
       console.log('Vérification du code PIN du Client...');
       await this.usersService.validatePIN(client_numero_compte, pin);

     // Générer un code OTP pour valider l'opération
     console.log('Génération du code OTP...');
     //await this.usersService.generateOTP(clientRecord.id, marchandRecord.id, montant);
      return this.usersService.generateOTP(clientRecord.id, marchandRecord.id, montant);


       //return { message: 'Un code OTP a été envoyé à votre adresse e-mail. Veuillez le saisir pour valider l\'opération.' };
     } catch (error) {
       console.error('Erreur interceptée :', error.message);
       throw error;
     }
 }
  // enpoint pour valider l'opération de dépot
  @Post('valider-payment')
  //@UseGuards(ClientGuard)
  async validerPayment(@Body() validationData: { client_numero_compte: string; marchand_numero_compte: string; montant: number; motif: string; otpCode: string}) {
    const { client_numero_compte, marchand_numero_compte, montant, motif, otpCode} = validationData;

  try {
    console.log('Données reçues pour la validation :', validationData);

    // Récupérer l'utilisateur Client
    console.log('Récupération des données du Client...');
    const clientRecord = await this.usersService.getUserByNumeroCompte(client_numero_compte);
    console.log('Client trouvé :', clientRecord);

    // Vérifier que le statut du Client est "Activated"
    console.log('Vérification du statut du Client...');
    await this.usersService.checkUserStatus(client_numero_compte);

    // Récupérer l'utilisateur Marchand_Business
    console.log('Récupération des données du Marchand_Business...');
    const marchandRecord = await this.usersService.getUserByNumeroCompte(marchand_numero_compte);
    console.log('Marchand_Business trouvé :', marchandRecord);

    // Vérifier que le statut du Marchand est "Activated"
    console.log('Vérification du statut du Marchand_Business...');
    await this.usersService.checkUserStatus(marchand_numero_compte);

    // Valider le code OTP
    console.log('Validation du code OTP...');
    await this.usersService.validateOTP(clientRecord.id, marchandRecord.id, otpCode, montant);

      console.log('Exécution de l\'opération...');
      const resultat = await this.usersService.executerOperationPayment(
        marchand_numero_compte,
        client_numero_compte,
        montant,
        motif
      );

    //return { message: 'Validation réussie. L\'opération peut être exécutée.' };
    return { message: 'Opération exécutée avec succès.', ...resultat };

  } catch (error) {
    console.error('Erreur lors de la validation ou de l\'exécution de l\'opération :', error.message);
    throw error;
  }
}

// renvoie de OTP
@Post('resend-otp')
//UseGuards(AuthGuard)
async regenerateOTP(@Body() otpData: { operationId: string }) {
  const { operationId } = otpData;

  try {
    console.log('Demande de régénération du code OTP reçue...');

    // Appeler le service pour regénérer le code OTP
    const result = await this.usersService.regenerateOTP(operationId);

    return { message: 'Nouveau code OTP généré avec succès.', ...result };
  } catch (error) {
    console.error('Erreur lors de la régénération du code OTP :', error.message);
    throw error;
  }
}

 //endpoint permettant à un Marchand d'effectuer un retarit auprès d'un Master. 
@Post('compensationMarchand')
 @UseGuards(MasterGuard)
 async retraitMarchand(@Body() approvisionnementData: { marchand_numero_compte: string; master_numero_compte: string; montant: number; pin: string }) {
   const { marchand_numero_compte, master_numero_compte, montant, pin } = approvisionnementData;
 
   try {
     console.log('Données reçues :', approvisionnementData);

  // Vérifier que les comptes à débiter et à créditer sont différents
  await this.usersService.validateDifferentAccounts(marchand_numero_compte, master_numero_compte);

     // Récupérer les enregistrements du Marchand et du master
     console.log('Récupération des données du Master...');
     const masterRecord = await this.usersService.getUserByNumeroCompte(master_numero_compte);
     console.log('Master trouvé :', masterRecord);
 
     console.log('Récupération des données du Marchand...');
     const marchandRecord = await this.usersService.getUserByNumeroCompte(marchand_numero_compte);
     console.log('Marchand trouvé :', marchandRecord);

    // Vérifier que les deux comptes sont du même pays
    await this.usersService.validateSameCountry(marchand_numero_compte, master_numero_compte);

     // Vérifier que le master est de type "master"
     console.log('Vérification du type utilisateur (master)...');
     await this.usersService.validateUserType(masterRecord.id, 'MASTER');
 
     // Vérifier que le Marchand est de type "MARCHAND"
     console.log('Vérification du type utilisateur (Marchand)...');
     await this.usersService.validateUserType(marchandRecord.id, 'MARCHAND');

     // Vérifier que le pays du master est "Activated"
     console.log('Vérification du statut du master...');
     await this.usersService.checkCountryStatusForUser(masterRecord.id);

     // Vérifier que le statut du master est "Activated"
     console.log('Vérification du statut du master...');
     await this.usersService.checkUserStatus(master_numero_compte);

     // Vérifier que le pays du Marchand est "Activated"
     console.log('Vérification du statut du Marchand...');
     await this.usersService.checkCountryStatusForMarchand(marchandRecord.id);

     // Vérifier que le statut du Marchand est "Activated"
     console.log('Vérification du statut du Marchand...');
     await this.usersService.checkUserStatusMarchand(marchand_numero_compte);

    // Calculer les frais de transfert
    /*const pays_id = masterRecord.pays_id?.[0]; // Récupérer l'ID du pays du master 1
    const type_operation = 'RETRAIT';
    const fraisTransfert = await this.grilleTarifaireService.getFraisOperation(pays_id, type_operation, montant); // Récupérer les frais
    const montantTotal = montant + fraisTransfert;*/

    // Vérifier que le Marchand est rattaché au Master
      console.log('Vérification du rattachement Master-Marchand...');
      const marchandsDuMaster = await this.usersService.getMarchandsByMaster(masterRecord.id);
      const isMarchandRattache = marchandsDuMaster.some((marchand) => marchand.id === marchandRecord.id);
      
      if (!isMarchandRattache) {
        console.log("Ce Marchand n'est pas rattaché à ce Master.");
        throw new Error("Ce Marchand n'est pas rattaché à ce Master.");
      }

     // Vérifier que le solde du Marchand est suffisant
     console.log('Vérification du solde du Marchand...');
     await this.usersService.validateSolde(marchandRecord.id, montant);
 
     // Vérifier le code PIN du Marchand
     console.log('Vérification du code PIN du Marchand...');
     await this.usersService.validatePIN(marchand_numero_compte, pin);

   // Générer un code OTP pour valider l'opération
   console.log('Génération du code OTP...');
   return this.usersService.generateOTP(marchandRecord.id, masterRecord.id, montant);

    //return { message: 'Un code OTP a été envoyé à votre adresse e-mail. Veuillez le saisir pour valider l\'opération.' };
   } catch (error) {
     console.error('Erreur interceptée :', error.message);
     throw error;
   }
}
 // enpoint pour valider l'opération de retrait
  @Post('valider-compensationMarchand')
  @UseGuards(MasterGuard)
  async validerRetraitMarchand(@Body() validationData: { master_numero_compte: string; marchand_numero_compte: string; montant: number; motif: string; otpCode: string }) {
    const { master_numero_compte, marchand_numero_compte, montant, motif, otpCode } = validationData;

  try {
    console.log('Données reçues pour la validation :', validationData);

    // Récupérer l'utilisateur Master 
    console.log('Récupération des données du Master ...');
    const masterRecord = await this.usersService.getUserByNumeroCompte(master_numero_compte);
    console.log('master trouvé :', masterRecord);

    // Vérifier que le statut du master est "Activated"
    console.log('Vérification du statut du Master...');
    await this.usersService.checkUserStatus(master_numero_compte);

    // Récupérer l'utilisateur Marchand
    console.log('Récupération des données du Marchand...');
    const marchandRecord = await this.usersService.getUserByNumeroCompte(marchand_numero_compte);
    console.log('Marchand trouvé :', marchandRecord);

    // Vérifier que le statut du Marchand est "Activated"
    console.log('Vérification du statut du Marchand...');
    await this.usersService.checkUserStatus(marchand_numero_compte);

    // Valider le code OTP
    console.log('Validation du code OTP...');
    await this.usersService.validateOTP(marchandRecord.id, masterRecord.id, otpCode, montant);

      console.log('Exécution de l\'opération...');
      const resultat = await this.usersService.executerCompensationMarchand(
        master_numero_compte,
        marchand_numero_compte,
        montant,
        motif
      );

    //return { message: 'Validation réussie. L\'opération peut être exécutée.' };
    return { message: 'Opération exécutée avec succès.', ...resultat };

  } catch (error) {
    console.error('Erreur lors de la validation ou de l\'exécution de l\'opération :', error.message);
    throw error;
  }
}

 //endpoint permettant à un Master, Business, ADMIN d'effectuer auprès de l'administration. 
@Post('compensationCadre')
 @UseGuards(AdminGuard)
 async retraitCadre(@Body() approvisionnementData: { cadre_numero_compte: string; admin_numero_compte: string; montant: number; pin: string }) {
   const { cadre_numero_compte, admin_numero_compte, montant, pin } = approvisionnementData;
 
   try {
     console.log('Données reçues :', approvisionnementData);

      // Vérifier que les comptes à débiter et à créditer sont différents
      await this.usersService.validateDifferentAccounts(cadre_numero_compte, admin_numero_compte);

     // Récupérer les enregistrements du cadre et du admin
     console.log('Récupération des données du admin...');
     const adminRecord = await this.usersService.getUserByNumeroCompte(admin_numero_compte);
     console.log('admin trouvé :', adminRecord);
 
     console.log('Récupération des données du cadre...');
     const cadreRecord = await this.usersService.getUserByNumeroCompte(cadre_numero_compte);
     console.log('cadre trouvé :', cadreRecord);

     // Vérifier que l'admin est de type "admin"
     console.log('Vérification du type utilisateur (admin)...');
     await this.usersService.validateUserType(adminRecord.id, 'ADMIN');
 
     // Vérifier que le cadre est de type "cadre"
     console.log('Vérification du type utilisateur (cadre)...');
     await this.usersService.validateUserTypeForCompensation(cadreRecord.id, ['ADMIN', 'MASTER', 'BUSINESS']);


     // Vérifier que le pays du cadre est "Activated"
     console.log('Vérification du statut du pays du cadre...');
     await this.usersService.checkCountryStatusForUser(cadreRecord.id);

     // Vérifier que le statut du cadre est "Activated"
     console.log('Vérification du statut du cadre...');
     await this.usersService.checkUserStatus(cadre_numero_compte);

    // Calculer les frais de transfert
    if(cadreRecord.type_utilisateur=="BUSINESS")
      {
        const montantTotal = (montant * 0.075) + montant;
      // Vérifier que le solde du cadre est suffisant
      console.log('Vérification du solde du cadre...');
      await this.usersService.validateSolde(cadreRecord.id, montantTotal);
  
      // Vérifier le code PIN du cadre
      console.log('Vérification du code PIN du cadre...');
      await this.usersService.validatePIN(cadre_numero_compte, pin);

      // Générer un code OTP pour valider l'opération
      console.log('Génération du code OTP...');
      return this.usersService.generateOTP(cadreRecord.id, adminRecord.id, montant);
      
      }
      else{
     // Vérifier que le solde du cadre est suffisant
     console.log('Vérification du solde du cadre...');
     await this.usersService.validateSolde(cadreRecord.id, montant);
 
     // Vérifier le code PIN du cadre
     console.log('Vérification du code PIN du cadre...');
     await this.usersService.validatePIN(cadre_numero_compte, pin);

      // Générer un code OTP pour valider l'opération
      console.log('Génération du code OTP...');
      return this.usersService.generateOTP(cadreRecord.id, adminRecord.id, montant);
      }

    //return { message: 'Un code OTP a été envoyé à votre adresse e-mail. Veuillez le saisir pour valider l\'opération.' };
   } catch (error) {
     console.error('Erreur interceptée :', error.message);
     throw error;
   }
}

 // enpoint pour valider l'opération de compensation d'un Master, Business, ADMIN. 
@Post('valider-compensationCadre')
  @UseGuards(AdminGuard)
  async validerRetraitCadre(@Body() validationData: { admin_numero_compte: string; cadre_numero_compte: string; montant: number; motif: string; otpCode: string }) {
    const { admin_numero_compte, cadre_numero_compte, montant, motif, otpCode } = validationData;

  try {
    console.log('Données reçues pour la validation :', validationData);

    // Récupérer l'utilisateur Admin 
    console.log('Récupération des données du Admin ...');
    const adminRecord = await this.usersService.getUserByNumeroCompte(admin_numero_compte);

    // Vérifier que le statut du admin est "Activated"
    console.log('Vérification du statut du admin...');
    await this.usersService.checkUserStatus(admin_numero_compte);

    // Récupérer l'utilisateur Cadre
    console.log('Récupération des données du cadre...');
    const cadreRecord = await this.usersService.getUserByNumeroCompte(cadre_numero_compte);
    console.log('cadre trouvé :', cadreRecord);

    // Vérifier que le statut du cadre est "Activated"
    console.log('Vérification du statut du cadre...');
    await this.usersService.checkUserStatus(cadre_numero_compte);

     // Vérifier que le solde du cadre est suffisant
     console.log('Vérification du solde du cadre...');
     await this.usersService.validateSolde(cadreRecord.id, montant);

    // Valider le code OTP
    console.log('Validation du code OTP...');
    await this.usersService.validateOTP(cadreRecord.id, adminRecord.id, otpCode, montant);

      console.log('Exécution de l\'opération...');
      const resultat = await this.usersService.executerCompensationCadre(
        cadre_numero_compte,
        admin_numero_compte,
        montant,
        motif
      );

    //return { message: 'Validation réussie. L\'opération peut être exécutée.' };
    return { message: 'Opération exécutée avec succès.', ...resultat };

  } catch (error) {
    console.error('Erreur lors de la validation ou de l\'exécution de l\'opération :', error.message);
    throw error;
  }
}
}
 
