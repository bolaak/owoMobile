// src/audit-log/audit-log.service.ts
import { Injectable } from '@nestjs/common';
//import Airtable from 'airtable';
import * as Airtable from 'airtable';
import { Config } from '../config';

@Injectable()
export class AuditLogService {
  private base;

  constructor() {
    // Configurez Airtable directement ici
    if (!Config.AIRTABLE_API_KEY || !Config.AIRTABLE_BASE_ID) {
      throw new Error('AIRTABLE_API_KEY or AIRTABLE_BASE_ID is not defined in the environment variables');
    }

    Airtable.configure({ apiKey: Config.AIRTABLE_API_KEY });
    this.base = Airtable.base(Config.AIRTABLE_BASE_ID);
  }

  // Enregistrer un log
  async createLog(userId: string, operationType: string, resourceType: string, resourceId: string, details: any) {
    try {
      const timestamp = new Date().toISOString(); // Horodatage actuel
      await this.base('AuditLog').create([
        {
          fields: {
            user_id: [userId], // Envoyez l'ID sous forme de tableau
            operation_type: operationType,
            resource_type: resourceType,
            resource_id: resourceId,
            details: JSON.stringify(details), // Convertissez les détails en chaîne JSON
            timestamp,
          },
        },
      ]);
    } catch (error) {
      console.error(`Erreur lors de la création du log : ${error.message}`);
    }
  }

  // méthode pour récupérer tous les logs dans le service AuditLogService
async getAllLogs() {
    const records = await this.base('AuditLog').select().all();
    return records.map((record) => ({ id: record.id, ...record.fields }));
  }
}