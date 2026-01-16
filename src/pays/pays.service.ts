import { Injectable } from '@nestjs/common';
import * as Airtable from 'airtable'; // Importation CommonJS
import { Config } from '../config';

@Injectable()
export class PaysService {
  private base;

  constructor() {
    // Configurez Airtable directement ici
    if (!Config.AIRTABLE_API_KEY) {
      throw new Error('AIRTABLE_API_KEY is not defined in the environment variables');
    }
    if (!Config.AIRTABLE_BASE_ID) {
      throw new Error('AIRTABLE_BASE_ID is not defined in the environment variables');
    }

    // Configurez Airtable avec la clé API
    Airtable.configure({ apiKey: Config.AIRTABLE_API_KEY });

    // Accédez à la base Airtable
    this.base = Airtable.base(Config.AIRTABLE_BASE_ID);
  }

  // Récupérer tous les pays
  async getAllPays() {
    const records = await this.base('Pays').select().all();
    return records.map((record) => ({ id: record.id, ...record.fields }));
  }

  // Récupérer un pays par son ID
  async getPaysById(id: string) {
    const records = await this.base('Pays')
      .select({ filterByFormula: `{id} = '${id}'` })
      .firstPage();

    if (records.length === 0) {
      throw new Error('Pays non trouvé.');
    }

    return { id: records[0].id, ...records[0].fields };
  }

  // Créer un nouveau pays
  async createPays(paysData: any) {
    try {
      const createdRecords = await this.base('Pays').create([{ fields: paysData }]);
      return { id: createdRecords[0].id, ...createdRecords[0].fields };
    } catch (error) {
      throw new Error(`Erreur lors de la création du pays : ${error.message}`);
    }
  }

  // Mettre à jour un pays existant
  async updatePays(id: string, updatedData: any) {
    try {
      await this.base('Pays').update(id, updatedData);
      return { message: 'Pays mis à jour avec succès.' };
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour du pays : ${error.message}`);
    }
  }

  // Supprimer un pays
  async deletePays(id: string) {
    try {
      await this.base('Pays').destroy(id);
      return { message: 'Pays supprimé avec succès.' };
    } catch (error) {
      throw new Error(`Erreur lors de la suppression du pays : ${error.message}`);
    }
  }

  
  // Mettre à jour le statut d'un pays
  async updatePaysStatus(id: string, status: string) {
    console.log(`Tentative de mise à jour du statut du pays avec ID ${id} vers "${status}".`);

    // Récupérer le pays par son ID
    const pays = await this.getPaysById(id);
    console.log(`Statut actuel du pays : ${pays.status}`);
  
    // Vérifier le statut actuel
    if (pays.status === status) {
      console.warn(`Le pays est déjà ${status.toLowerCase()}. Aucune mise à jour nécessaire.`);
      throw new Error(`Le pays est déjà ${status.toLowerCase()}.`);
    }
  
    try {
      // Mettre à jour le statut
      await this.base('Pays').update(id, { status });
      console.log(`Statut du pays mis à jour avec succès vers "${status}".`);
      return { message: `Le statut du pays a été mis à jour à "${status}".` };
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du statut du pays : ${error.message}`);
      throw new Error(`Erreur lors de la mise à jour du statut du pays : ${error.message}`);
    }
  }

}