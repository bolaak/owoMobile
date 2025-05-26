import { Injectable } from '@nestjs/common';
import * as Airtable from 'airtable'; // Importation CommonJS
import { Config } from '../config';

@Injectable()
export class OTPService {
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
  async getAll() {
    const records = await this.base('OTP').select().all();
    return records.map((record) => ({ id: record.id, ...record.fields }));
  }

    // Récupérer un pays par son ID
    async getOperationById(operationId: string): Promise<any> {
    try {
        console.log(`Récupération de l'opération ID : ${operationId}`);

        const otpRecords = await this.base('OTP')
        .select({
            filterByFormula: `{operation_id} = '${operationId}'`,
        })
        .firstPage();

        if (otpRecords.length === 0) {
        throw new Error("Aucune opération trouvée pour cet ID.");
        }

        const operation = otpRecords[0];
        return {
        id: operation.id,
        operationId: operation.fields.operation_id,
        userId: operation.fields.user_id?.[0],
        motif: operation.fields.motif,
        orderId: operation.fields.orderId,
        businessNumeroCompte: operation.fields.business_numero_compte,
        farmers: JSON.parse(operation.fields.farmers || '[]'), // Convertir la chaîne JSON en tableau
        totalAmount: operation.fields.montant,
        expiresAt: operation.fields.expires_at,
        codeExpired: operation.fields.code_expired,
        };
    } catch (error) {
        console.error(`Erreur lors de la récupération de l'opération : ${error.message}`);
        throw error;
    }
    }

}