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
  // Récupérer toutes les transactions
    async getAllTransaction() {
    const records = await this.base('Transactions').select().all();
    return records.map((record) => ({ id: record.id, ...record.fields }));
    
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
      const formattedData: any = {
        ...transactionData,
      };

      if (transactionData.expediteur_id !== undefined) {
        formattedData.expediteur_id = Array.isArray(transactionData.expediteur_id)
          ? transactionData.expediteur_id
          : [transactionData.expediteur_id];
      }

      if (transactionData.destinataire_id !== undefined) {
        formattedData.destinataire_id = Array.isArray(transactionData.destinataire_id)
          ? transactionData.destinataire_id
          : [transactionData.destinataire_id];
      }
      /*const formattedData = {
        ...transactionData,
        expediteur_id: [transactionData.expediteur_id],
        destinataire_id: [transactionData.destinataire_id],
      };*/
      //console.log('Payload Airtable :', formattedData);

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

  // Méthode pour compter le nombre de transactions où l'utilisateur est impliqué en tant qu'expéditeur ou destinataire
  async getTransactionCountForUser(userId: string): Promise<number> {
    try {
      console.log(`Calcul du nombre de transactions pour l'utilisateur ID : ${userId}`);
  
      const transactions = await this.base('Transactions')
        .select({
          filterByFormula: `OR({expediteur_id} = '${userId}', {destinataire_id} = '${userId}', {utilisateur_id} = '${userId}')`,
        })
        .all();
  
      return transactions.length;
    } catch (error) {
      console.error(`Erreur lors du calcul du nombre de transactions : ${error.message}`);
      throw error;
    }
  }
  // Méthode pour récupérer les détails de la dernière transaction impliquant l'utilisateur
  async getLastTransactionForUser(userId: string): Promise<any> {
    try {
      console.log(`Récupération de la dernière transaction pour l'utilisateur ID : ${userId}`);
  
      const transactions = await this.base('Transactions')
        .select({
          filterByFormula: `OR({expediteur_id} = '${userId}', {destinataire_id} = '${userId}')`,
          sort: [{ field: 'date_transaction', direction: 'desc' }],
        })
        .firstPage();
  
      if (transactions.length === 0) {
        return null; // Aucune transaction trouvée
      }
  
      const lastTransaction = transactions[0];
      return {
        montant: lastTransaction.fields.montant,
        date: lastTransaction.fields.date_transaction,
        type_operation: lastTransaction.fields.type_operation,
      };
    } catch (error) {
      console.error(`Erreur lors de la récupération de la dernière transaction : ${error.message}`);
      throw error;
    }
  }

  // src/transactions/transactions.service.ts
  async getTransactionHistory(userId: string): Promise<any[]> {
    try {
      console.log(`Récupération de l'historique des transactions pour l'utilisateur ID : ${userId}`);

      const transactions = await this.base('Transactions')
        .select({
          filterByFormula: `OR({expediteur_id} = '${userId}', {destinataire_id} = '${userId}', {utilisateur_id} = '${userId}', {compteCommission} = '${userId}')`,
          sort: [{ field: 'date_transaction', direction: 'asc' }], // Tri par date croissante
        })
        .all();

      return transactions.map((record) => {
        const isDebit = record.fields.expediteur_id?.[0] || record.fields.compteCommission?.[0] === userId;
        const isCredit = record.fields.destinataire_id?.[0] || record.fields.utilisateur_id?.[0] === userId;

        // Sélectionner la description en fonction du sens de l'opération
        const description = isDebit
          ? record.fields.exp_desc || 'Aucune description disponible'
          : isCredit
          ? record.fields.dest_desc || 'Aucune description disponible'
          : 'Description inconnue';

        return {
          id: record.id,
          date: record.fields.date_transaction,
          type_operation: record.fields.type_operation,
          description, // Description dynamique
          motif: record.fields.motif,
          montant: record.fields.montant,
          frais: record.fields.frais,        
          expediteur_id: record.fields.expediteur_id?.[0],
          destinataire_id: record.fields.destinataire_id?.[0],
          utilisateur_id: record.fields.utilisateur_id?.[0],
          compteCommission: record.fields.compteCommission?.[0],


        };
      });
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'historique des transactions : ${error.message}`);
      throw error;
    }
  }

  // src/transactions/transactions.service.ts
  async getTransactionHistoryType(userId: string, type_operation: string): Promise<any[]> {
    try {
      console.log(`Récupération de l'historique des transactions pour l'utilisateur ID : ${userId}`);

      const transactions = await this.base('Transactions')
        .select({
          filterByFormula: `{type_operation} = '${type_operation}', OR({expediteur_id} = '${userId}', {destinataire_id} = '${userId}', {utilisateur_id} = '${userId}', {compteCommission} = '${userId}')`,
          sort: [{ field: 'date_transaction', direction: 'asc' }], // Tri par date croissante
        })
        .all();

      return transactions.map((record) => {
        const isDebit = record.fields.expediteur_id?.[0] === userId;
        const isCredit = record.fields.destinataire_id?.[0] === userId;

        // Sélectionner la description en fonction du rôle de l'utilisateur
        const description = isDebit
          ? record.fields.exp_desc || 'Aucune description disponible'
          : isCredit
          ? record.fields.dest_desc || 'Aucune description disponible'
          : 'Description inconnue';

        return {
          id: record.id,
          date: record.fields.date_transaction,
          type_operation: record.fields.type_operation,
          description, // Description dynamique 
          motif: record.fields.motif,
          montant: record.fields.montant,
          frais: record.fields.frais,        
          expediteur_id: record.fields.expediteur_id?.[0],
          destinataire_id: record.fields.destinataire_id?.[0],
          utilisateur_id: record.fields.utilisateur_id?.[0],
          compteCommission: record.fields.compteCommission?.[0],

        };
      });
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'historique des transactions : ${error.message}`);
      throw error;
    }
  }

  // Méthode pour traiter les données récupérées et calculer le solde progressif, ainsi que les totaux des débits et des crédits.
  calculateAccountStatement(transactions: any[], userId: string): any {
    let balance = 0; // Solde initial
    let totalDebit = 0; // Total des débits
    let totalCredit = 0; // Total des crédits

    const statement = transactions.map((transaction) => {
      const isDebit = transaction.expediteur_id === userId || transaction.compteCommission === userId;
      const isCredit = transaction.destinataire_id === userId || transaction.utilisateur_id === userId ;

      let amount = 0;
      if (isDebit) {
        amount = -transaction.montant; 
        totalDebit += transaction.montant;
        /*const total = transaction.montant + transaction.frais;
        amount = -total; 
        totalDebit += total;*/
      } else if (isCredit) {
        amount = transaction.montant; 
        totalCredit += transaction.montant;
      }

      balance += amount; // Mise à jour du solde progressif

      return {
        id:transaction.id,
        date: transaction.date,
        type_operation: transaction.type_operation,
        description: transaction.description,
        frais: transaction.frais || 0,
        motif: transaction.motif,
        montant: amount,
        balance: balance,
      };
    });
    // Calcul du solde final
    const finalBalance = totalCredit - totalDebit;
    return {
      statement,
      totalDebit,
      totalCredit,
      finalBalance, // Ajout du solde final

    };
  }
}