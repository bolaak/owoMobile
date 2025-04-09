import { Injectable } from '@nestjs/common';
import * as Airtable from 'airtable';
import { Config } from '../config';

@Injectable()
export class CompteSystemeService {
  private base;

  constructor() {
    // Configurez Airtable directement ici
    if (!Config.AIRTABLE_API_KEY || !Config.AIRTABLE_BASE_ID) {
      throw new Error('AIRTABLE_API_KEY or AIRTABLE_BASE_ID is not defined in the environment variables');
    }

    Airtable.configure({ apiKey: Config.AIRTABLE_API_KEY });
    this.base = Airtable.base(Config.AIRTABLE_BASE_ID);
  }

  // Récupérer tous les comptes système
  async getAllComptesSysteme() {
    const records = await this.base('CompteSysteme').select().all();
    return records.map((record) => ({ id: record.id, ...record.fields }));
  }

  // Récupérer un compte système par son ID
  async getCompteSystemeById(id: string) {
    const records = await this.base('CompteSysteme')
      .select({ filterByFormula: `{id} = '${id}'` })
      .firstPage();

    if (records.length === 0) {
      throw new Error('Compte système non trouvé.');
    }

    return { id: records[0].id, ...records[0].fields };
  }

  // Créer un nouveau compte système
async createCompteSysteme(compteData: any) {
    const { typeOperation } = compteData;
  
    // Validation : vérifier que le type d'opération est unique
    const isUnique = await this.isTypeOperationUnique(typeOperation);
    if (!isUnique) {
      throw new Error(`Un compte système pour le type d'opération "${typeOperation}" existe déjà.`);
    }
  
    try {
      const numero_compte = Math.floor(100000000 + Math.random() * 900000000).toString(); // Génère un numéro de compte unique
      const createdRecords = await this.base('CompteSysteme').create([
        {
          fields: {
            ...compteData,
            numCompte: numero_compte,
            solde: 0, // Initialisation du solde à 0
          },
        },
      ]);
      return { id: createdRecords[0].id, ...createdRecords[0].fields };
    } catch (error) {
      throw new Error(`Erreur lors de la création du compte système : ${error.message}`);
    }
  }

  // Mettre à jour un compte système existant
  async updateCompteSysteme(id: string, updatedData: any) {
    try {
      await this.base('CompteSysteme').update(id, updatedData);
      return { message: 'Compte système mis à jour avec succès.' };
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour du compte système : ${error.message}`);
    }
  }

  // Supprimer un compte système
  async deleteCompteSysteme(id: string) {
    try {
      await this.base('CompteSysteme').destroy(id);
      return { message: 'Compte système supprimé avec succès.' };
    } catch (error) {
      throw new Error(`Erreur lors de la suppression du compte système : ${error.message}`);
    }
  }

  // méthode pour vérifier si un compte système existe déjà pour un type d'opération donné
async isTypeOperationUnique(typeOperation: string): Promise<boolean> {
    const records = await this.base('CompteSysteme')
      .select({ filterByFormula: `{typeOperation} = '${typeOperation}'` })
      .firstPage();
  
    return records.length === 0; // Retourne true si aucun compte n'existe pour ce type d'opération
  }

  // Récupérer le compte système par type d'opération
  async getCompteSystemeByTypeOperation(typeOperation: string): Promise<any> {
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
    } catch (error) {
      console.error(`Erreur lors de la recherche du compte système : ${error.message}`);
      throw error;
    }
  }

// méthode pour créditer le solde du compte système identifié.
async crediterCompteSysteme(compteId: string, montant: number): Promise<void> {
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
  } catch (error) {
    console.error(`Erreur lors du crédit du compte système : ${error.message}`);
    throw error;
  }
}

// méthode pour déditer le solde du compte système identifié.
async debiterCompteSysteme(compteId: string, montant: number): Promise<void> {
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
  } catch (error) {
    console.error(`Erreur lors du dédit du compte système : ${error.message}`);
    throw error;
  }
}

async updateSoldeSysteme(compteId: string, newSolde: number): Promise<void> {
  try {
    // Vérifier que l'utilisateur existe
    const compteRecords = await this.base('CompteSysteme')
      .select({ filterByFormula: `{id} = '${compteId}'` })
      .firstPage();

    if (compteRecords.length === 0) {
      throw new Error('Compte introuvable.');
    }

    // Mettre à jour le solde de l'utilisateur
    await this.base('CompteSysteme').update(compteId, { solde: newSolde });
  } catch (error) {
    throw new Error(`Erreur lors de la mise à jour du solde : ${error.message}`);
  }
}
}