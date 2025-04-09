// src/codes-recharge/codes-recharge.service.ts
import { Injectable } from '@nestjs/common';
import * as Airtable from 'airtable';
import { Config } from '../config';

@Injectable()
export class CodesRechargeService {
  private base;

  constructor() {
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
  async createCodeRecharge(codeData: any) {
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

    // Validation : vérifier que le montant est >= 1 000 000
    if (montant < 1000000) {
        throw new Error('Le montant doit être supérieur ou égal à 1 000 000.');
    }

    // Validation : vérifier si le Master a déjà un code de recharge actif
    const hasActiveCode = await this.hasActiveCode(master_id);
    if (hasActiveCode) {
        throw new Error('Ce Master a un code de recharge actif.');
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
      throw new Error(`Erreur lors de la mise à jour du code de recharge : ${error.message}`);
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
}