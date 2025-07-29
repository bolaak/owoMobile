// src/commissionnement/commissionnement.service.ts
import { Injectable } from '@nestjs/common';
import * as Airtable from 'airtable';
import { Config } from '../config';
//import { UsersService } from '../users/users.service';
import {PaysService } from '../pays/pays.service';



@Injectable()
export class CommissionnementService {
  private base;

  constructor(private readonly paysService: PaysService) {

    // Configurez Airtable directement ici
    if (!Config.AIRTABLE_API_KEY || !Config.AIRTABLE_BASE_ID) {
      throw new Error('AIRTABLE_API_KEY or AIRTABLE_BASE_ID is not defined in the environment variables');
    }

    Airtable.configure({ apiKey: Config.AIRTABLE_API_KEY });
    this.base = Airtable.base(Config.AIRTABLE_BASE_ID);
  }

  // Récupérer tous les taux de commissionnement
  async getAllCommissionnements() {
    const records = await this.base('Commissionnement').select().all();
    return records.map((record) => ({ id: record.id, ...record.fields }));
  }

  // Récupérer un taux de commissionnement par son ID
  async getCommissionnementById(id: string) {
    const records = await this.base('Commissionnement')
      .select({ filterByFormula: `{id} = '${id}'` })
      .firstPage();

    if (records.length === 0) {
      throw new Error('Taux de commissionnement non trouvé.');
    }

    return { id: records[0].id, ...records[0].fields };
  }

  // Créer un nouveau taux de commissionnement
  async createCommissionnement(commissionData: any) {
    const { typeUtilisateur, pourcentage, typeOperation, pays_id } = commissionData;
  
    // Validation : vérifier que le type d'utilisateur est valide
    if (!this.isValidTypeUtilisateur(typeUtilisateur, pays_id)) {
      throw new Error(`Le type d'utilisateur "${typeUtilisateur}" n'est pas autorisé. Les valeurs autorisées sont : MARCHAND, MASTER, ADMIN, TAXE.`);
    }

    // Validation : vérifier que le type d'utilisateur est unique
    const isUnique = await this.isTypeUtilisateurUnique(typeUtilisateur, pays_id, typeOperation);
    if (!isUnique) {
        throw new Error(`Un pourcentage de commissionnement pour le type d'utilisateur "${typeUtilisateur}" existe déjà.`);
    }
    // Récupérez l'ID du pays correspondant
      const pays = await this.paysService.getPaysById(commissionData.pays_id);
  
      if (!pays) {
        throw new Error(`Le pays "${commissionData.pays_id}" n'existe pas.`);
      }
      // Formatez le champ "pays" comme un tableau d'IDs
      commissionData.pays_id = [pays.id];
      console.log(`Erreur lors de la création du taux de commissionnement : ${pays_id}`);

    try {
      const createdRecords = await this.base('Commissionnement').create([{ fields: commissionData }]);
      return { id: createdRecords[0].id, ...createdRecords[0].fields };
    } catch (error) {
      console.log(`Erreur lors de la création du taux de commissionnement : ${error.message}`);
      throw error;
    }
  }

  // Mettre à jour un taux de commissionnement existant
  async updateCommissionnement(id: string, updatedData: any) {
    const { typeUtilisateur, typeOperation, pays_id } = updatedData;
  
    // Validation : vérifier que le type d'utilisateur est valide
    if (typeUtilisateur && !this.isValidTypeUtilisateur(typeUtilisateur, pays_id)) {
      throw new Error(`Le type d'utilisateur "${typeUtilisateur}" n'est pas autorisé. Les valeurs autorisées sont : MARCHAND, MASTER, ADMIN.`);
    }

    // Validation : vérifier que le type d'utilisateur est unique
    if (typeUtilisateur) {
        const existingRecord = await this.base('Commissionnement')
        .select({ filterByFormula: `AND({typeUtilisateur} = '${typeUtilisateur}', {typeOperation} = '${typeOperation}', {pays_id} = '${pays_id}', NOT({id} = '${id}'))` })
        .firstPage();

        if (existingRecord.length > 0) {
        throw new Error(`Un pourcentage de commissionnement pour le type d'utilisateur "${typeUtilisateur}" existe déjà.`);
        }
    } 
     // Récupérez l'ID du pays correspondant
      const pays = await this.paysService.getPaysById(updatedData.pays_id);

    if (!pays) {
      throw new Error(`Le pays "${updatedData.pays_id}" n'existe pas.`);
    }
    // Formatez le champ "pays" comme un tableau d'IDs
    updatedData.pays_id = [pays.id];
       
    try {
      await this.base('Commissionnement').update(id, updatedData);
      return { message: 'Taux de commissionnement mis à jour avec succès.' };
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour du taux de commissionnement : ${error.message}`);
    }
  }

  // Supprimer un taux de commissionnement
  async deleteCommissionnement(id: string) {
    try {
      await this.base('Commissionnement').destroy(id);
      return { message: 'Taux de commissionnement supprimé avec succès.' };
    } catch (error) {
      throw new Error(`Erreur lors de la suppression du taux de commissionnement : ${error.message}`);
    }
  }

  // une méthode pour vérifier que le typeUtilisateur est valide.
    private isValidTypeUtilisateur(typeUtilisateur: string, pays_id: string): boolean {
        const allowedTypes = ['MARCHAND', 'MASTER', 'ADMIN', 'TAXE'];
        return allowedTypes.includes(typeUtilisateur);
    }

    // méthode pour vérifier si un pourcentage existe déjà pour un type d'utilisateur donné.
    async isTypeUtilisateurUnique(typeUtilisateur: string, pays_id: string, typeOperation: string): Promise<boolean> {
        const records = await this.base('Commissionnement')
        .select({ filterByFormula: `AND({typeUtilisateur} = '${typeUtilisateur}',{typeOperation} = '${typeOperation}', {pays_id} = '${pays_id}')` })
        .firstPage();
    
        return records.length === 0; // Retourne true si aucun enregistrement n'existe pour ce type d'utilisateur
 }

// Méthode pour récupérer les commissions associées à une opération spécifique.
async getCommissionsByOperation(typeOperation: string, paysId: string): Promise<any[]> {
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
  } catch (error) {
    console.error(`Erreur lors de la récupération des commissions :`, error.message);
    throw error;
  }
}
    
}