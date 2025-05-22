// src/codes-recharge/codes-recharge.service.ts
import { Injectable } from '@nestjs/common';
import * as Airtable from 'airtable';
import { Config } from '../config';
import { GCSService } from '../google_cloud/gcs.service';
import { unlinkSync } from 'fs';

@Injectable()
export class CodesRechargeService {
  private base;

  constructor(private readonly gcsService: GCSService) {
    // Configurez Airtable directement ici
    if (!Config.AIRTABLE_API_KEY || !Config.AIRTABLE_BASE_ID) {
      throw new Error('AIRTABLE_API_KEY or AIRTABLE_BASE_ID is not defined in the environment variables');
    }

    Airtable.configure({ apiKey: Config.AIRTABLE_API_KEY });
    this.base = Airtable.base(Config.AIRTABLE_BASE_ID);
  }

  // Récupérer tous les codes de recharge
  async getAllCodesRecharge() {
    const records = await this.base('CodesRecharge').select().all();
    return records.map((record) => ({ id: record.id, ...record.fields }));
  }

  // Récupérer un code de recharge par son ID
  async getCodeRechargeById(id: string) {
    const records = await this.base('CodesRecharge')
      .select({ filterByFormula: `{id} = '${id}'` })
      .firstPage();

    if (records.length === 0) {
      throw new Error('Code de recharge non trouvé.');
    }

    return { id: records[0].id, ...records[0].fields };
  }

  // Créer un nouveau code de recharge
  async createCodeRecharge(codeData: any, files?: Express.Multer.File[]): Promise<any> {
    const { montant, master_id } = codeData;
  
    // Validation : vérifier que le Master existe et est de type "MASTER"
    await this.validateMasterId(master_id);

    // Validation : vérifier si le statut du pays du Master est "Activated"
    const isCountryActivated = await this.isCountryActivated(master_id);
    if (!isCountryActivated) {
        throw new Error('Le pays associé à ce Master n\'est pas activé.');
    }
    
    // Validation : vérifier si le statut du Master est "Activated"
    const isActivated = await this.isMasterActivated(master_id);
    if (!isActivated) {
        throw new Error('Ce Master n\'est pas activé et ne peut pas recevoir de code de recharge.');
    }
      // Convertir montant en nombre si c'est une chaîne
      if (codeData.montant && typeof codeData.montant === 'string') {
        codeData.montant = parseFloat(codeData.montant); // Conversion en nombre
      }
      
    // Validation : vérifier que le montant est >= 1 000 000
    if (montant < 1000000) {
        throw new Error('Le montant doit être supérieur ou égal à 1 000 000.');
    }

    // Validation : vérifier si le Master a déjà un code de recharge actif
    const hasActiveCode = await this.hasActiveCode(master_id);
    if (hasActiveCode) {
        throw new Error('Ce Master a un code de recharge actif.');
    }
        // Gestion des images locales
    if (files && files.length > 0) {
      // Uploader chaque fichier vers GCS
      const uploadedImages = await Promise.all(
        files.map(async (file) => {
          try {
            // Uploader l'image vers GCS
            const publicUrl = await this.gcsService.uploadImage(file.path);

            // Supprimer le fichier local après l'upload
            unlinkSync(file.path); // Nettoyage du fichier temporaire

            return publicUrl;
          } catch (error) {
            console.error('Erreur lors de l\'upload de l\'image :', error.message);
            throw new Error('Impossible d\'uploader l\'image.');
          }
        })
      );
      // Remplacer le champ attached par les URLs des images uploadées
      codeData.attached = uploadedImages.map(url => ({ url }));
    } else if (codeData.attached) {
      // Si attached est une chaîne (URL), convertissez-la en tableau d'objets
      if (typeof codeData.attached === 'string') {
        codeData.attached = [{ url: codeData.attached }];
      }
      // Si attached est un tableau de chaînes, convertissez chaque élément
      else if (Array.isArray(codeData.attached)) {
        codeData.attached = codeData.attached.map(url => ({ url }));
      }
    }
  
    try {
      const code = Math.floor(1000000000000 + Math.random() * 9000000000000).toString(); // Génère un code unique sur 13 chiffres
      const createdRecords = await this.base('CodesRecharge').create([
        {
          fields: {
            montant,
            master_id: [master_id], // Encapsuler master_id dans un tableau
            code,
            status: 'Activated', // Initialisation du statut à Activated
          },
        },
      ]);
      return { id: createdRecords[0].id, ...createdRecords[0].fields };
    } catch (error) {
      throw new Error(`Erreur lors de la création du code de recharge : ${error.message}`);
    }
  }

  // Mettre à jour un code de recharge existant
  async updateCodeRecharge(id: string, updatedData: any) {
    const { master_id } = updatedData;
  
    // Validation : vérifier que le Master existe et est de type "MASTER" si master_id est fourni
    if (master_id) {
      await this.validateMasterId(master_id);
    }
  
    try {
      await this.base('CodesRecharge').update(id, updatedData);
      return { message: 'Code de recharge mis à jour avec succès.' };
    } catch (error) {
      throw error; //(`Erreur lors de la mise à jour du code de recharge : ${error.message}`);
    }
  }

  // Supprimer un code de recharge
  async deleteCodeRecharge(id: string) {
    try {
      await this.base('CodesRecharge').destroy(id);
      return { message: 'Code de recharge supprimé avec succès.' };
    } catch (error) {
      throw new Error(`Erreur lors de la suppression du code de recharge : ${error.message}`);
    }
  }

    // Méthode vérifie que le master_id existe et correspond à un utilisateur de type Master .
    async validateMasterId(masterId: string): Promise<void> {
        const masterRecords = await this.base('Utilisateurs')
        .select({ filterByFormula: `AND({id} = '${masterId}', {type_utilisateur} = 'MASTER')` })
        .firstPage();
    
        if (masterRecords.length === 0) {
        throw new Error('L\'utilisateur spécifié est introuvable ou n\'est pas de type MASTER.');
        }
    }

    // méthode pour vérifier si un Master a déjà un code de recharge avec le statut Activated.
    async hasActiveCode(masterId: string): Promise<boolean> {
        const records = await this.base('CodesRecharge')
        .select({ filterByFormula: `AND({master_id} = '${masterId}', {status} = 'Activated')` })
        .firstPage();
    
        return records.length > 0; // Retourne true si un code actif existe pour ce Master
    }

    //méthode pour vérifier si le statut du Master est Activated.
    async isMasterActivated(masterId: string): Promise<boolean> {
        const masterRecords = await this.base('Utilisateurs')
        .select({ filterByFormula: `AND({id} = '${masterId}', {status} = 'Activated')` })
        .firstPage();
    
        return masterRecords.length > 0; // Retourne true si le Master a le statut Activated
    }

    // méthode pour vérifier si le statut du pays associé au Master est Activated
    async isCountryActivated(masterId: string): Promise<boolean> {
        const masterRecords = await this.base('Utilisateurs')
        .select({
            filterByFormula: `{id} = '${masterId}'`,
            fields: ['pays_id'], // Récupérer uniquement le champ pays
        })
        .firstPage();
    
        if (masterRecords.length === 0) {
        throw new Error('Le Master spécifié est introuvable.');
        }
    
        const countryId = masterRecords[0].fields.pays_id?.[0]; // Récupérer l'ID du pays (champ de type lien)
    
        if (!countryId) {
        throw new Error('Aucun pays associé à ce Master.');
        }
    
        const countryRecords = await this.base('Pays')
        .select({ filterByFormula: `AND({id} = '${countryId}', {status} = 'Activated')` })
        .firstPage();
    
        return countryRecords.length > 0; // Retourne true si le pays a le statut Activated
  }

 // méthode pour valider et utiliser un code de recharge.
 async useCodeRecharge(masterId: string, code: string) {
  // Rechercher le code de recharge
  const records = await this.base('CodesRecharge')
    .select({
      filterByFormula: `{code} = '${code}'`,
    })
    .firstPage();

  if (records.length === 0) {
    throw new Error('Ce code de recharge n\'existe pas.');
  }

  const codeRecord = records[0];
  const montant = codeRecord.fields.montant;
  const associatedMasterId = codeRecord.fields.master_id?.[0]; // Récupérer l'ID du Master associé

  // Vérifier si le code est associé au Master spécifié
  if (associatedMasterId !== masterId) {
    throw new Error('Ce code de recharge n\'est pas associé à cet utilisateur.');
  }

  // Vérifier si le code est déjà utilisé
  const status = codeRecord.fields.status;
  if (status !== 'Activated') {
    throw new Error('Ce code de recharge a déjà été utilisé.');
  }

  // Mettre à jour le statut du code de recharge à "Deactivated"
  await this.base('CodesRecharge').update(codeRecord.id, { status: 'Deactivated' });

  return { montant };
}
/*async useCodeRecharge(masterId: string, code: string) {
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
}*/
//méthode pour récupérer l'ID d'enregistrement d'un code de recharge en fonction de son code unique.
async getCodeRechargeIdByCode(code: string): Promise<string> {
  const records = await this.base('CodesRecharge')
    .select({ filterByFormula: `{code} = '${code}'` })
    .firstPage();

  if (records.length === 0) {
    throw new Error('Code de recharge introuvable.');
  }

  return records[0].id; // Retourne l'ID d'enregistrement du code de recharge
}

  // Méthode pour récupérer les codes de recharge d'un utilisateur
  async getRechargeCodesForUser(userId: string): Promise<any[]> {
    try {
      console.log(`Récupération des codes de recharge pour l'utilisateur ID : ${userId}`);

      const rechargeRecords = await this.base('CodesRecharge')
        .select({
          filterByFormula: `{master_id} = '${userId}'`,
          sort: [{ field: 'created_at', direction: 'desc' }], // Tri par date décroissante
        })
        .all();

      return rechargeRecords.map((record) => ({
        id: record.id,
        code: record.fields.code,
        montant: record.fields.montant,
        status: record.fields.status,
        created_at: record.fields.created_at,
        master_id: record.fields.master_id?.[0],
        master_name: record.fields.master_name?.[0],
        master_pays: record.fields.master_pays?.[0],


      }));
    } catch (error) {
      console.error(`Erreur lors de la récupération des codes de recharge : ${error.message}`);
      throw error;
    }
  }
}