// src/agripay/agripay.service.ts
import axios from 'axios';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AgripayService {
    private readonly logger = new Logger(AgripayService.name);
  private readonly API_URL = 'https://agriconnect-bc17856a61b8.herokuapp.com/orders/';

  // Méthode pour récupérer les détails de la commande
  async getOrderDetails(orderId: string): Promise<any> {
    try {
      console.log(`Récupération des détails de la commande orderId : ${orderId}`);


    const response = await axios.get(`${this.API_URL}details/${orderId}`);
    console.log('Réponse de l\'API externe :', response.data); // Afficher la réponse complète

    // Vérifier que la réponse est un tableau
    if (!Array.isArray(response.data)) {
      throw new Error("La réponse de l'API n'est pas un tableau d'agriculteurs.");
    }

    return response.data; // Renvoyer directement le tableau des agriculteurs
    } catch (error) {
      console.error(`Erreur lors de la récupération des détails de la commande : ${orderId}`, error.orderDetails?.data || error.message);
      throw error; //('Impossible de récupérer les détails de la commande.');
    }
  }

   // Nouvelle méthode pour mettre à jour le statut de paiement
  async updateOrderPaymentStatus(orderId: string, status: string = 'PAID'): Promise<any> {
    try {
      this.logger.log(`Tentative de mise à jour du statut pour ${orderId} à ${status}`);
      
        const payload = {
        farmerPayment: status // Format simplifié
        // OU selon les besoins de l'API :
        //fields: { farmerPayment: status }
      };
      const response = await axios.put(
      `${this.API_URL}updateOrder/${orderId}`,
      payload,
      {
        timeout: 5000,
        headers: { 'Content-Type': 'application/json' }
      }
    );

      this.logger.log(`Statut mis à jour pour ${orderId}`);
      return response.data;
    } catch (error) {
      // Gestion d'erreur améliorée
      if (error.response) {
        this.logger.error(`Erreur API: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        throw new Error(`L'API a répondu avec ${error.response.status}: ${error.response.data?.message || 'Pas de détail'}`);
      } else if (error.request) {
        this.logger.error(`Pas de réponse de l'API: ${error.message}`);
        throw new Error('Le service de commandes ne répond pas');
      } else {
        throw new Error(`Erreur de configuration: ${error.message}`);
      }
    }
  }
  async getOrderFarmerPayment(orderId: string): Promise<any> {
    try {
      this.logger.log(`Récupération des détails de la commande ${orderId}`);
      const response = await axios.get(`${this.API_URL}${orderId}`);

      // Vérification de la structure de la réponse
      if (!response.data?.fields) {
        throw new Error("Réponse de l'API invalide: champ 'fields' manquant");
      }

      // Vérification du statut de paiement par l'acheteur
      if (response.data.fields.payStatus !== 'PAID') {
        throw new Error('Cette commande n\'a pas encore été payée');
      }
      // Vérification du statut de paiement des agriculteurs
      if (response.data.fields.farmerPayment === 'PAID') {
        throw new Error('Le paiement des agriculteurs de cette commande a déjà été effectué');
      }

      return response.data.fields; // Retourne tous les champs
    } catch (error) {
      this.logger.error(`Erreur API pour la commande ${orderId}`, error.stack);
      throw error; //(`Impossible de récupérer le statut de paiement des agriculteurs: ${error.message}`);
    }
  }
}