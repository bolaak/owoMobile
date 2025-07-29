// src/grille-tarifaire/grille-tarifaire.service.ts
import { Injectable } from '@nestjs/common';
//import { Airtable } from 'airtable'; // Importation ES6
import * as Airtable from 'airtable';
import { Config } from '../config';
import {PaysService } from '../pays/pays.service';


@Injectable()
export class GrilleTarifaireService {
  private base;

  constructor(private readonly paysService: PaysService) {
    if (!Config.AIRTABLE_API_KEY || !Config.AIRTABLE_BASE_ID) {
        throw new Error('AIRTABLE_API_KEY or AIRTABLE_BASE_ID is not defined in the environment variables');
    }

    // Configurez Airtable globalement
    const airtable = new Airtable({ apiKey: Config.AIRTABLE_API_KEY });
    console.log('Airtable configured successfully:', airtable);

    // Accédez directement à la base
    this.base = airtable.base(Config.AIRTABLE_BASE_ID);
    console.log('Base initialized:', this.base);
}

   // Récupérer toutes les grilles tarifaires
  async getAllGrilleTarifaire() {
    const records = await this.base('GrilleTarifaire').select().all();
    return records.map((record) => ({ id: record.id, ...record.fields }));
  }

  // Récupérer une grille tarifaire par son ID
  async getGrilleTarifaireById(id: string) {
    const records = await this.base('GrilleTarifaire')
      .select({ filterByFormula: `{id} = '${id}'` })
      .firstPage();

    if (records.length === 0) {
      throw new Error('Grille tarifaire non trouvée.');
    }

    return { id: records[0].id, ...records[0].fields };
  }

  // Créer une nouvelle grille tarifaire
  /*createGrilleTarifaire(grilleData: any) {
    const { min_montant, max_montant } = grilleData;
  
    // Validation : min_montant doit être strictement inférieur à max_montant
    if (min_montant >= max_montant) {
      throw new Error('Le montant minimum doit être strictement inférieur au montant maximum.');
    }
  
    // Validation : vérifier les chevauchements avec les plages existantes
    await this.validatePlageMontant(min_montant, max_montant);
  
    try {
      const createdRecords = await this.base('GrilleTarifaire').create([{ fields: grilleData }]);
      return { id: createdRecords[0].id, ...createdRecords[0].fields };
    } catch (error) {
      throw new Error(`Erreur lors de la création de la grille tarifaire : ${error.message}`);
    }
  }*/
    async createGrilleTarifaire(grilleData: any) {
      const { min_montant, max_montant, pays_id, type_operation } = grilleData;
    
      // Validation : min_montant doit être strictement inférieur à max_montant
      if (min_montant >= max_montant) {
        throw new Error('Le montant minimum doit être strictement inférieur au montant maximum.');
      }
    
      // Validation : vérifier que le pays existe
      await this.checkCountryExists(pays_id);

    // Assurez-vous que pays_id est un tableau
    grilleData.pays_id = Array.isArray(pays_id) ? pays_id : [pays_id];
    
      // Validation : vérifier les chevauchements avec les plages existantes pour le même pays
      await this.validatePlageMontant(min_montant, max_montant, pays_id, type_operation);
    
      try {
        const createdRecords = await this.base('GrilleTarifaire').create([{ fields: grilleData }]);
        return { id: createdRecords[0].id, ...createdRecords[0].fields };
      } catch (error) {
        throw new Error(`Erreur lors de la création de la grille tarifaire : ${error.message}`);
      }
    }

  // Mettre à jour une grille tarifaire existante
async updateGrilleTarifaire(id: string, updatedData: any) {
  // Récupérer la grille tarifaire existante
  const existingGrille = await this.getGrilleTarifaireById(id);

  // Extraire le pays_id de la grille existante
  const pays_id = existingGrille.pays_id[0]; // Supposons que pays_id est stocké sous forme de tableau

  // Extraire le type_operation de la grille existante
  const type_operation = existingGrille.type_operation[0]; // Supposons que pays_id est stocké sous forme de tableau

  const { min_montant, max_montant } = updatedData;

  // Validation : min_montant doit être strictement inférieur à max_montant
  if (min_montant >= max_montant) {
    throw new Error('Le montant minimum doit être strictement inférieur au montant maximum.');
  }

  // Validation : vérifier les chevauchements avec les plages existantes pour le même pays
  await this.validatePlageMontant(min_montant, max_montant, pays_id, type_operation);

  try {
    // Mettre à jour la grille tarifaire
    await this.base('GrilleTarifaire').update(id, updatedData);
    return { message: 'Grille tarifaire mise à jour avec succès.' };
  } catch (error) {
    throw new Error(`Erreur lors de la mise à jour de la grille tarifaire : ${error.message}`);
  }
}

  // Supprimer une grille tarifaire
  async deleteGrilleTarifaire(id: string) {
    try {
      await this.base('GrilleTarifaire').destroy(id);
      return { message: 'Grille tarifaire supprimée avec succès.' };
    } catch (error) {
      throw new Error(`Erreur lors de la suppression de la grille tarifaire : ${error.message}`);
    }
  }
// méthode pour vérifier si une nouvelle plage chevauche une plage existante
async validatePlageMontant(min_montant: number, max_montant: number, pays_id: string, type_operation: string): Promise<void> {
  // Récupérer toutes les grilles tarifaires pour le pays spécifié
  const records = await this.base('GrilleTarifaire')
    .select({ filterByFormula: `{pays_id} = '${pays_id}', {type_operation} = '${type_operation}'` })
    .all();

  for (const record of records) {
    const existingMin = parseFloat(record.fields.min_montant);
    const existingMax = parseFloat(record.fields.max_montant);

    // Vérifier s'il y a un chevauchement
    if (
      (min_montant >= existingMin && min_montant <= existingMax) || // Nouvelle plage commence dans une plage existante
      (max_montant >= existingMin && max_montant <= existingMax) || // Nouvelle plage se termine dans une plage existante
      (min_montant <= existingMin && max_montant >= existingMax)    // Nouvelle plage englobe une plage existante
    ) {
      throw new Error(`La plage [${min_montant}, ${max_montant}] chevauche une plage existante [${existingMin}, ${existingMax}] pour ce pays.`);
    }
  }
}
/*async validatePlageMontant(min_montant: number, max_montant: number): Promise<void> {
    // Récupérer toutes les grilles tarifaires existantes
    const records = await this.base('GrilleTarifaire').select().all();
  
    for (const record of records) {
      const existingMin = parseFloat(record.fields.min_montant);
      const existingMax = parseFloat(record.fields.max_montant);
  
      // Vérifier s'il y a un chevauchement
      if (
        (min_montant >= existingMin && min_montant <= existingMax) || // Nouvelle plage commence dans une plage existante
        (max_montant >= existingMin && max_montant <= existingMax) || // Nouvelle plage se termine dans une plage existante
        (min_montant <= existingMin && max_montant >= existingMax)    // Nouvelle plage englobe une plage existante
      ) {
        throw new Error(`La plage [${min_montant}, ${max_montant}] chevauche une plage existante [${existingMin}, ${existingMax}].`);
      }
    }
  }*/

// méthode pour vérifier que le pays associé existe dans la table Pays.
async checkCountryExists(countryId: string): Promise<void> {
  const country = await this.base('Pays').find(countryId);

  if (!country) {
    throw new Error('Le pays spécifié est introuvable.');
  }
}

// méthode pour récupérer toutes les plages tarifaires associées à un pays spécifique
async getGrilleTarifaireByCountryId(countryId: string): Promise<any[]> {
  // Vérifier que le pays existe
  const country = await this.base('Pays').find(countryId);

  if (!country) {
    throw new Error('Le pays spécifié est introuvable.');
  }

  // Récupérer toutes les grilles tarifaires pour le pays spécifié
  const records = await this.base('GrilleTarifaire')
    .select({ filterByFormula: `{pays_id} = '${countryId}'` })
    .all();

  return records.map((record) => ({
    id: record.id,
    ...record.fields,
  }));
}

  // Méthode pour récupérer les frais de transfert
  async getFraisOperation(pays_id: string, type_operation: string, montant: number): Promise<number> {
    try {
      console.log(`Récupération des frais pour pays_id : ${pays_id}, type_operation : ${type_operation}, montant : ${montant}`);

      // Requête pour récupérer les plages de frais correspondantes
      const grilleRecords = await this.base('GrilleTarifaire')
        .select({
          filterByFormula: `AND({pays_id} = '${pays_id}', {type_operation} = '${type_operation}', {min_montant} <= ${montant}, {max_montant} >= ${montant})`,
        })
        .firstPage();

      if (grilleRecords.length === 0) {
        throw new Error("Aucune grille tarifaire trouvée pour les paramètres donnés.");
      }

      // Récupérer les frais depuis le premier enregistrement trouvé
      const frais = grilleRecords[0].fields.frais;
      console.log(`Frais trouvés : ${frais}`);
      return frais;
    } catch (error) {
      console.error(`Erreur lors de la récupération des frais : ${error.message}`);
      throw error;
    }
  }

}