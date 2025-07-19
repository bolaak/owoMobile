// src/agripay/agripay.controller.ts
import { Controller, Post, Body,Put, Get, Delete, Param, UsePipes, ValidationPipe, UseGuards,Request, UseInterceptors, UploadedFiles, UploadedFile } from '@nestjs/common';
import { AgripayService } from './agripay.service';
import {UsersService } from '../users/users.service';
import { BusinessGuard } from '../auth/business.guard';
import { TransactionsService } from '../transactions/transactions.service';
import { OTPService } from '../otp/otp.service';

@Controller('agripay')
export class AgripayController {
  constructor(
   private readonly agripayService: AgripayService,
   private readonly usersService: UsersService,
   private readonly transactionsService: TransactionsService,
   private readonly otpService: OTPService,) {}

@Post('initiate-agripay')
//@UseGuards(BusinessGuard)
async initiateAgripay(
  @Body() agripayData: {
    business_numero_compte: string;
    orderId: string;
    motif: string;
    pin: string;
  }
) {
  const { business_numero_compte, orderId, pin, motif } = agripayData;

  try {
    console.log(`🔄 Initialisation AGRIPAY pour orderId : ${orderId}`);

    // 1. Vérification du statut de paiement
    const orderPayment = await this.agripayService.getOrderFarmerPayment(orderId);
    if (orderPayment.farmerPayment === 'PAID') {
      throw new Error('❌ Cette commande a déjà été payée.');
    }

    // 2. Récupération des agriculteurs
    const farmers = await this.agripayService.getOrderDetails(orderId);
    if (!Array.isArray(farmers) || farmers.length === 0) {
      throw new Error("❌ Aucun agriculteur trouvé dans la réponse de l'API.");
    }

    // 3. Filtrage et validation des comptes agriculteurs
    const processedFarmers: { numCompte: string; montant: number }[] = [];

    for (const farmer of farmers) {
      try {
        if (!farmer.compteOwo || !farmer.totalAmount) {
          console.warn(`⚠️ Agriculteur ignoré : données manquantes (compteOwo ou totalAmount).`);
          continue;
        }

        const farmerUser = await this.usersService.getUserByNumeroCompte(farmer.compteOwo);
        if (!farmerUser) {
          console.warn(`⚠️ Compte agriculteur introuvable : ${farmer.compteOwo}`);
          continue;
        }

        // Validation facultative : s'assurer que l'utilisateur est bien un AGRICULTEUR
        await this.usersService.validateUserType(farmerUser.id, 'CLIENT');

        processedFarmers.push({
          numCompte: farmer.compteOwo,
          montant: farmer.totalAmount * 0.8, // Déduction de 20%
        });
      } catch (err) {
        console.warn(`⚠️ Erreur sur le compte ${farmer.compteOwo} : ${err.message}`);
        continue;
      }
    }

    if (processedFarmers.length === 0) {
      throw new Error("❌ Aucun agriculteur valide avec un compte reconnu.");
    }

    console.log(`✅ ${processedFarmers.length} agriculteur(s) valide(s) prêt(s) à être crédité(s).`);

    // 4. Récupération et validation du compte Marchand
    const marchandRecord = await this.usersService.getUserByNumeroCompte(business_numero_compte);
    if (!marchandRecord) {
      throw new Error(`❌ Compte marchand ${business_numero_compte} introuvable.`);
    }

    await this.usersService.validateUserType(marchandRecord.id, 'BUSINESS');
    console.log('✅ Compte marchand validé.');

    // 5. Calcul du montant total
    const totalAmount = processedFarmers.reduce((sum, farmer) => sum + farmer.montant, 0);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      throw new Error("❌ Le montant total calculé est invalide.");
    }

    console.log(`💰 Montant total à débiter : ${totalAmount} XOF`);

    // 6. Validation du solde et du code PIN
    await this.usersService.validateSolde(marchandRecord.id, totalAmount);
    console.log('🔐 Vérification du code PIN du Marchand...');
    await this.usersService.validatePIN(business_numero_compte, pin);

    // 7. Génération de l’OTP pour validation finale
    await this.usersService.generateAgripayOTP(
      marchandRecord.id,
      totalAmount,
      orderId,
      processedFarmers,
      motif
    );

    // 8. Réponse succès
    return {
      message: '✅ OTP envoyé pour validation.',
      totalAmount,
      orderId,
      farmers: processedFarmers,
    };

  } catch (error) {
    console.error(`❌ Erreur AGRIPAY : ${error.message}`);
    throw error;
  }
}


/*async initiateAgripay(
  @Body() agripayData: { business_numero_compte: string; orderId: string, motif: string, pin: string }
) {
  const { business_numero_compte, orderId, pin, motif} = agripayData;

  try {
    console.log(`Demande d'initialisation de l'opération AGRIPAY pour orderId : ${orderId}`);
    // Récupération des détails complets
    const orderPayment = await this.agripayService.getOrderFarmerPayment(orderId);

    // Vérification supplémentaire du statut (redondante mais sécurisée)
    if (orderPayment.farmerPayment === 'PAID') {
      throw new Error('Cette commande a déjà été payée');
    }

    // Étape 1 : Récupérer les détails de la commande
    const farmers = await this.agripayService.getOrderDetails(orderId);

    // Vérifier que les données des agriculteurs sont valides
    if (!Array.isArray(farmers) || farmers.length === 0) {
      throw new Error("Aucun agriculteur trouvé dans la réponse de l'API.");
    }

    // Extraire les informations nécessaires
    const processedFarmers = farmers.map((farmer: any) => {
      if (!farmer.compteOwo || !farmer.totalAmount) {
        throw new Error("Les données d'un agriculteur sont incomplètes (compteOwo ou totalAmount manquant).");
      }
      return {
        numCompte: farmer.compteOwo,
        montant: farmer.totalAmount * 0.8, // Appliquer une déduction de 20%
      };
    });
   
       const marchandRecord = await this.usersService.getUserByNumeroCompte(business_numero_compte);
       console.log('Marchand_Business trouvé :', marchandRecord);
   
       // Vérifier que le Marchand est de type "BUSINESS"
       console.log('Vérification du type utilisateur (Marchand_Business)...');
       await this.usersService.validateUserType(marchandRecord.id, 'BUSINESS');

    // Calculer le montant total à débiter
    const totalAmount = processedFarmers.reduce((sum: number, farmer) => sum + farmer.montant, 0);
    console.log('Montant total calculé :', totalAmount); // Afficher le montant total calculé

    // Vérifier que totalAmount est un nombre valide
    if (isNaN(totalAmount) || totalAmount <= 0) {
      throw new Error("Le montant total calculé est invalide.");
    }

    // Étape 2 : Valider le solde du compte EBUSINESS
    await this.usersService.validateSolde(marchandRecord.id, totalAmount);

    // Vérifier le code PIN du Client
    console.log('Vérification du code PIN du Marchand_business...');
    await this.usersService.validatePIN(business_numero_compte, pin);

    // Étape 3 : Envoyer un OTP pour validation
    await this.usersService.generateAgripayOTP(marchandRecord.id, totalAmount, orderId, processedFarmers, motif);

    // Retourner les informations nécessaires pour la validation
    return {
      message: 'OTP envoyé pour validation..',
      //operationId,
      totalAmount,
      orderId,
      farmers: processedFarmers,
    };
  } catch (error) {
    console.error(`Erreur lors de l'initialisation de l'opération AGRIPAY : ${error.message}`);
    throw error; //(`Erreur lors de l'initialisation de l'opération AGRIPAY : ${error.message}`);
  }
}*/

@Post('validate-agripay')
//@UseGuards(BusinessGuard)
async validateAgripay(@Body() validationData: { business_numero_compte: string; operationId: string; otpCode: string}) {
  const { business_numero_compte, operationId, otpCode } = validationData;

  try {
    console.log(`Demande de validation de l'opération AGRIPAY pour operationId : ${operationId}`);
    
       const marchandRecord = await this.usersService.getUserByNumeroCompte(validationData.business_numero_compte);
       console.log('Marchand_Business trouvé :', marchandRecord.numero_compte);

    // Étape 1 : Récupérer les données de l'opération
    const operation = await this.otpService.getOperationById(operationId);
    const { business_numero_compte, farmers, orderId, motif } = operation;

    // Étape 2 : Valider le compte solde du MARCHAND_BUSINESS
    const totalAmount = farmers.reduce((sum: number, farmer: any) => sum + farmer.montant, 0);
    await this.usersService.validateSolde(marchandRecord.id, totalAmount);

    
    // Étape 3 : Valider l'OTP
     await this.usersService.validateAgripayOTP(marchandRecord.id, operationId, otpCode);

    // Étape 4 : Créditer les comptes CLIENT
    await this.usersService.creditClientAccounts(operation.orderId, motif, farmers);

    // Étape 5 : Enregistrer les transactions
    for (const farmer of farmers) {
      const clientRecord = await this.usersService.getUserByNumeroCompte(farmer.numCompte);
      console.log('Agriculteur trouvé :', farmer.numero_compte);
      await this.transactionsService.createTransactionAppro({
        type_operation: 'AGRIPAY',
        montant: farmer.montant,
        operation_id:operationId,
        orderId: orderId.id,
        expediteur_id: marchandRecord.id,
        destinataire_id: clientRecord.id,
        motif: operation.motif,
        description: `Paiement agriculteur pour la commande ${orderId}`,
        status: 'SUCCESS',
      });
    }

    // Étape 6 : Débiter le compte EBUSINESS
    await this.usersService.debitBusinessAccount(marchandRecord.numero_compte, totalAmount, orderId, motif);

    // Étape 7 : Mise à jour du statut via le service
    await this.agripayService.updateOrderPaymentStatus(orderId);

    return { message: 'Opération AGRIPAY validée avec succès.' };
  } catch (error) {
    console.error(`Erreur lors de la validation de l'opération AGRIPAY : ${error.message}`);
    throw error; //(`Erreur lors de la validation de l'opération AGRIPAY : ${error.message}`);
  }
}
}