// src/transactions/transactions.service.ts
import { Injectable } from '@nestjs/common';
import * as Airtable from 'airtable'; // Importez Airtable correctement
import { Config } from '../config';

@Injectable()
export class TransactionsService {
  private base;

  constructor() {
    if (!Config.AIRTABLE_API_KEY || !Config.AIRTABLE_BASE_ID) {
      throw new Error('AIRTABLE_API_KEY or AIRTABLE_BASE_ID is not defined in the environment variables');
    }

    Airtable.configure({ apiKey: Config.AIRTABLE_API_KEY });
    this.base = Airtable.base(Config.AIRTABLE_BASE_ID);
  }

  // Créer une nouvelle transaction
  async createTransaction(transactionData: any) {
    try {
      console.log('Données brutes reçues pour la transaction :', transactionData);
  
      // Encapsuler utilisateur_id et code_recharge_id dans des tableaux
      const formattedData = {
        ...transactionData,
        utilisateur_id: [transactionData.utilisateur_id], // Encapsuler dans un tableau
        code_recharge_id: [transactionData.code_recharge_id], // Encapsuler dans un tableau
      };
  
      console.log('Données formatées pour Airtable :', formattedData);
  
      const createdRecords = await this.base('Transactions').create([{ fields: formattedData }]);
      return { id: createdRecords[0].id, ...createdRecords[0].fields };
    } catch (error) {
      console.error('Erreur lors de la création de la transaction :', error.message);
      throw new Error(`Erreur lors de la création de la transaction : ${error.message}`);
    }
  }

  //méthode pour créer une transaction d'approvisionnement.
  async createTransactionAppro(transactionData: any) {
    try {
      // Encapsuler expediteur_id et destinataire_id dans des tableaux
      const formattedData = {
        ...transactionData,
        expediteur_id: [transactionData.expediteur_id],
        destinataire_id: [transactionData.destinataire_id],
      };
  
      const createdRecords = await this.base('Transactions').create([{ fields: formattedData }]);
      return { id: createdRecords[0].id, ...createdRecords[0].fields };
    } catch (error) {
      throw new Error(`Erreur lors de la création de la transaction : ${error.message}`);
    }
  }
  
  //méthode pour valider et utiliser un code de recharge.
    async useCodeRecharge(masterId: string, code: string) {
        // Rechercher le code de recharge
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
    
        // Mettre à jour le statut du code de recharge à "Deactivated"
        await this.base('CodesRecharge').update(codeRecord.id, { status: 'Deactivated' });
    
        return { montant };
}

  // Méthode pour créer une transaction de commission
  async createCommissionTransaction(
    montant: number,
    compteCommissionId: string,
    destinataireId: string,
    description: string
  ): Promise<void> {
    try {
      console.log(`Création d'une transaction de commission...`);

      await this.base('Transactions').create({
        type_operation: 'COMMISSION',
        montant,
        //date_transaction: new Date().toISOString(),
        compteCommission: [compteCommissionId],
        expediteur_id: null, // Pas d'expéditeur spécifique pour les commissions
        destinataire_id: [destinataireId],
        description,
        status: 'SUCCESS',
      });

      console.log(`Transaction de commission créée avec succès.`);
    } catch (error) {
      console.error(`Erreur lors de la création de la transaction de commission : ${error.message}`);
      throw error;
    }
  }
}