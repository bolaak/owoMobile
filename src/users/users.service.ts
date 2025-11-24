// src/users/users.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import * as Airtable from 'airtable'; // Importez Airtable correctement
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { MailService } from '../mail/mail.service';
import { TransactionsService } from '../transactions/transactions.service';
import { Config } from '../config';
import { AuditLogService } from '../audit-log/audit-log.service';
import {GrilleTarifaireService } from '../grille-tarifaire/grille-tarifaire.service';
import {CompteSystemeService } from '../compte-systeme/compte-systeme.service';
import {CommissionnementService } from '../commissionnement/commissionnement.service';
import { GCSService } from '../google_cloud/gcs.service';
import { unlinkSync } from 'fs';
import { Storage } from '@google-cloud/storage';
import { Multer } from 'multer';





@Injectable()
export class UsersService {
  private base;

  constructor(
    private readonly mailService: MailService,
    private readonly grilleTarifaireService: GrilleTarifaireService,
    private readonly compteSystemeService: CompteSystemeService, 
    private readonly commissionsService: CommissionnementService, 
    private readonly transactionsService: TransactionsService,    
    private readonly gcsService: GCSService) {

    // Configurez Airtable directement ici
    const airtable = new Airtable({ apiKey: Config.AIRTABLE_API_KEY });
    if (!Config.AIRTABLE_BASE_ID) {
      throw new Error('AIRTABLE_BASE_ID is not defined in the environment variables');
    }
    this.base = airtable.base(Config.AIRTABLE_BASE_ID);
  }
// src/users/users.service.ts
private readonly allowedFields = [
  'nom',
  'prenom',
  'date_naissance',
  'nationalite',
  'email',
  'telephone',
  'city',
  'adresse',
  'pays_id',
];

  async createUser(userData: any) {
    // Vérifiez que le pays existe
    await this.checkCountryExists(userData.pays_id);

    // Vérifiez que le statut du pays est "Activated"
    await this.checkCountryStatus(userData.pays_id);  

    // Vérifiez l'unicité de l'email
    await this.checkEmailUniqueness(userData.email);

  // Validation spécifique pour les Marchands
  if (userData.type_utilisateur === 'MARCHAND') {
    if (!userData.code_marchand) {
      throw new Error('Le code marchand est requis pour créer un utilisateur de type Marchand.');
    }

    // Valider le code marchand
    const master = await this.validateMerchantCode(userData.code_marchand);

    // Attacher l'ID du Master au Marchand
    userData.master_id = master.id;
    userData.master_associated = master.nom;

  }

    
    const numero_compte = Math.floor(100000000 + Math.random() * 900000000).toString();
    const PIN = Math.floor(10000 + Math.random() * 90000).toString();
    const hashedPIN = await bcrypt.hash(PIN, 10); // Hachage du code PIN
    const mot_de_passe = uuidv4().substring(0, 8); // Mot de passe temporaire
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

  // Générer un code marchand uniquement pour les utilisateurs de type MASTER
  let code_marchand: null | string = null; // Déclaration avec un type union
  if (userData.type_utilisateur === 'MASTER') {
    code_marchand = await this.generateUniqueMerchantCode();
  }
  if (userData.type_utilisateur === 'BUSINESS') {
    code_marchand = await this.generateUniqueMerchantCode();
  }  

    try {

    // Logs pour vérifier les données avant l'envoi à Airtable
    console.log('Données à envoyer à Airtable :', {
      ...userData,
      numero_compte,
      PIN: hashedPIN,
      mot_de_passe: hashedPassword,
      solde: 0,
      tentatives_echec: 0,
      pays_id: [userData.pays_id],
      master_id: userData.master_id, // Inclure master_id uniquement pour les Marchands
      master_associated:userData.master_associated,

    });

      await this.base('Utilisateurs').create([
        {
          fields: {
            ...userData,
            numero_compte,
            PIN: hashedPIN, // Enregistrement du code PIN haché
            mot_de_passe: hashedPassword,
            solde: 0,
            tentatives_echec : 0,
            pays_id: [userData.pays_id], // Envoyez l'ID sous forme de tableau
            code_marchand: code_marchand, // Ajouter le code marchand uniquement pour les MASTERS
            master_id: userData.master_id ? userData.master_id : '', // Envoyer master_id uniquement s'il est défini
            master_associated: userData.master_associated ? userData.master_associated : '', // Envoyer master_associated uniquement s'il est défini
          },
        },
      ]);

      // Envoyez les détails de connexion par email
      /*const emailContent = `
        Bonjour ${userData.nom} ${userData.prenom},
        
        Votre compte Mobile Money a été créé avec succès. Voici vos informations de connexion :
        - Numéro de compte : ${numero_compte}
        - Code PIN : ${PIN}
        - Mot de passe : ${mot_de_passe}

      ${
        userData.type_utilisateur === 'MASTER' || userData.type_utilisateur === 'BUSINESS'
          ? `- Code marchand : ${code_marchand}\n`
          : ''
      }
      
        Veuillez conserver ces informations en sécurité. Un code PIN vous sera demandé lors des opérations sensibles.

      `;*/
      const emailContent = `
      <div style="font-family: Arial, sans-serif; background:#f4f4f7; padding:20px;">
        <div style="max-width:600px; margin:auto; background:white; border-radius:12px; padding:30px; box-shadow:0 5px 15px rgba(0,0,0,0.08);">

          <h2 style="text-align:center; color:#2d3748; margin-bottom:10px;">
            🎉 Félicitations! Votre portefeuille électronique a été créé avec succès.
          </h2>
          <p style="text-align:center; color:#4a5568; font-size:15px; margin-top:0;">
            OWOO AFRIKA – Bienvenue dans votre espace sécurisé
          </p>

          <p style="font-size:16px; color:#2d3748;">
            Bonjour <strong>${userData.name}</strong> 👋,
          </p>

          <p style="font-size:15px; color:#4a5568; line-height:1.6;"> 
            Voici vos informations de connexion :
          </p>

          <div style="background:#f7fafc; padding:20px; border-radius:10px; margin:20px 0; border:1px solid #e2e8f0;">
            <p style="margin:0; font-size:15px; color:#2d3748; line-height:1.8;">
              🔢 <strong>Numéro de compte :</strong> ${numero_compte}<br>
              🔐 <strong>Code PIN :</strong> ${PIN}<br>
              🔑 <strong>Mot de passe :</strong> ${mot_de_passe}<br>
              ${
                userData.type_utilisateur === 'MASTER' || userData.type_utilisateur === 'BUSINESS'
                  ? `💼 <strong>Code marchand :</strong> ${code_marchand}<br>`
                  : ''
              }
            </p>
          </div>

          <p style="font-size:15px; color:#4a5568; line-height:1.6;">
            ⚠️ Merci de conserver ces informations en lieu sûr.<br>
            🔒 Le code PIN vous sera demandé pour valider toute opération sensible.
          </p>

          <p style="font-size:14px; color:#718096; margin-top:30px; text-align:center;">
            Si vous n'êtes pas à l'origine de cette création de compte, contactez immédiatement notre support.
          </p>

          <p style="text-align:center; font-size:13px; color: #777; margin-top:10px;">
            © 💙💛 OWOO AFRIKA – Sécurité & Confiance 🔒
          </p>          

        </div>
      </div>
      `;

      await this.mailService.sendMail(
        userData.email,
        '🔢 Ouverture de compte -  OWOO AFRIKA',
        emailContent
      );
    // Enregistrer un log
    /*await this.auditLogService.createLog(
      userId,
      'CREATE',
      'Utilisateur',
      createdUser[0].id,
      { ...userData }
    );*/
      return { numero_compte};
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur :', error.message, error.stack);
      throw error;
    }
}

  // méthode validatePIN pour valider le code PIN d'un utilisateur.
  async validatePIN(numero_compte: string, pin: string): Promise<boolean> {
    console.log(`Validation du code PIN pour le numéro de compte : ${numero_compte}`);

    // Récupérer l'utilisateur par son numéro de compte
    const user = await this.getUserByNumeroCompte(numero_compte);
    console.log(`Utilisateur trouvé : ${user.numero_compte}`);
    console.log(`Code PIN trouvé : ${user.PIN}`);


    // Vérifier si le code PIN est défini pour cet utilisateur
    if (!user.PIN) {
      throw new Error('Code PIN non défini pour cet utilisateur');
    }
      console.log(`Code PIN : ${user.PIN}`);

    // Comparer le code PIN saisi avec celui haché
    const isValid = await bcrypt.compare(pin, user.PIN);
    if (!isValid) {
      throw new Error('Code PIN incorrect');
    }

    console.log(`Code PIN validé avec succès pour le numéro de compte : ${numero_compte}`);
    return true;
  }


async checkEmailUniqueness(email: string): Promise<void> {
  const records = await this.base('Utilisateurs')
    .select({ filterByFormula: `{email} = '${email}'` })
    .firstPage();

  if (records.length > 0) {
    throw new Error('Cet email est déjà utilisé.');
  }
}
// Existence de pays
async checkCountryExists(pays_id: string): Promise<void> {
  const records = await this.base('Pays')
    .select({ filterByFormula: `{id} = '${pays_id}'` })
    .firstPage();

  if (records.length === 0) {
    throw new Error('Le pays spécifié est invalide.');
  }
}

// Selectionner un utilisateur spécifique par id

async getUserById(id: string) {
  try {
    // Récupérer les enregistrements depuis Airtable
    const records = await this.base('Utilisateurs')
      .select({ filterByFormula: `{id} = '${id}'` })
      .firstPage();

    if (records.length === 0) {
      throw new Error('Utilisateur non trouvé.');
    }

    // Extraire les champs de l'utilisateur
    const userFields = records[0].fields;

    // Supprimer les champs sensibles
    //delete userFields.mot_de_passe; 
    //delete userFields.PIN; 
    //delete userFields.pays_id; 
    delete userFields.master_id;
    delete userFields.destinataire; 
    delete userFields.expediteur; 
    delete userFields.CodesRecharge; 
    delete userFields.recharge_master; 
    delete userFields.OTP; 
 


    console.log('Utilisateur récupéré avec succès (champs sensibles mot_de_passe et PIN  exclus).');
    return userFields;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur :', error.message);
    throw new Error(`Erreur lors de la récupération de l'utilisateur : ${error.message}`);
  }
}

// Selectionner un utilisateur spécifique par numéro de compte
async getUserByNumeroCompte(numero_compte: string) {
  console.log(`Recherche de l'utilisateur avec le numéro de compte : ${numero_compte}`);
  const records = await this.base('Utilisateurs')
    .select({ filterByFormula: `{numero_compte} = '${numero_compte}'` })
    .firstPage();

  if (records.length === 0) {
    console.log(`Aucun utilisateur trouvé avec le numéro de compte : ${numero_compte}`);
    throw new Error('Utilisateur non trouvé.');
  }

      // Extraire les champs de l'utilisateur
    const userFields = records[0].fields;

    // Supprimer les champs sensibles
    //delete userFields.mot_de_passe; 
    //delete userFields.PIN; 
    //delete userFields.pays_id; 
    delete userFields.master_id;
    delete userFields.destinataire; 
    delete userFields.expediteur; 
    delete userFields.CodesRecharge; 
    delete userFields.recharge_master; 
    delete userFields.OTP; 

  console.log(`Utilisateur trouvé :`, records[0]);
  return records[0].fields;
}

// Méthode pour vérifier que deux comptes sont différents.
async validateDifferentAccounts(numeroCompte1: string, numeroCompte2: string): Promise<void> {
  if (numeroCompte1 === numeroCompte2) {
    throw new Error("Le compte à créditer ne peut pas être le même que le compte à débiter.");
  }
}
// méthode vérifie si deux utilisateurs n'appartiennent pas au même pays en comparant leurs champs pays_id
async validateNotSameCountry(numeroCompte1: string, numeroCompte2: string): Promise<void> {
  try {
    console.log(`Vérification que les comptes ${numeroCompte1} et ${numeroCompte2} ne sont pas du même pays...`);

    // Récupérer les enregistrements des deux comptes
    const compte1 = await this.getUserByNumeroCompte(numeroCompte1);
    const compte2 = await this.getUserByNumeroCompte(numeroCompte2);

    // Vérifier si les deux comptes existent
    if (!compte1 || !compte2) {
      throw new Error("L\'un ou les deux comptes sont introuvables.");
    }

    // Récupérer les IDs des pays associés aux comptes
    const paysId1 = compte1.pays_id?.[0];
    const paysId2 = compte2.pays_id?.[0];

    // Vérifier si les deux comptes sont du même pays
    if (paysId1 == paysId2) {
      console.log(`Pays récupérés : paysId1 : ${paysId1}(${compte1.nom_pays}) et paysId1 :  ${paysId2}(${compte2.nom_pays}).`);
      throw new Error("Les deux comptes sont du même pays.");
    }

    console.log(`Validation réussie : Les comptes ${numeroCompte1} et ${numeroCompte2} ne sont pas du même pays.`);
  } catch (error) {
    console.error(`Erreur lors de la validation des comptes : ${error.message}`);
    throw error;
  }
}
// méthode vérifie si deux utilisateurs appartiennent au même pays en comparant leurs champs pays_id
async validateSameCountry(numeroCompte1: string, numeroCompte2: string): Promise<void> {
  try {
    console.log(`Vérification que les comptes ${numeroCompte1} et ${numeroCompte2} sont du même pays...`);

    // Récupérer les enregistrements des deux comptes
    const compte1 = await this.getUserByNumeroCompte(numeroCompte1);
    const compte2 = await this.getUserByNumeroCompte(numeroCompte2);

    // Vérifier si les deux comptes existent
    if (!compte1 || !compte2) {
      throw new Error("L\'un ou les deux comptes sont introuvables.");
    }

    // Récupérer les IDs des pays associés aux comptes
    const paysId1 = compte1.pays_id?.[0];
    const paysId2 = compte2.pays_id?.[0];

    // Vérifier si les deux comptes sont du même pays
    if (paysId1 !== paysId2) {
      console.log(`Pays récupérés : paysId1 : ${paysId1}(${compte1.nom_pays}) et paysId1 :  ${paysId2}(${compte2.nom_pays}).`);
      throw new Error("Les deux comptes ne sont pas du même pays.");
    }

    console.log(`Validation réussie : Les comptes ${numeroCompte1} et ${numeroCompte2} sont du même pays.`);
  } catch (error) {
    console.error(`Erreur lors de la validation des comptes : ${error.message}`);
    throw error;
  }
}
//méthode pour vérifier si un utilisateur est de type Marchand ou Master et s'il est actif.
async validateUserType(userId: string, userType: string): Promise<void> {
  try {
    console.log(`Validation du type utilisateur pour l'ID : ${userId}, Type attendu : ${userType}`);
    const userRecords = await this.base('Utilisateurs')
      .select({ filterByFormula: `AND({id} = '${userId}', {type_utilisateur} = '${userType}')` })
      .firstPage();

    if (userRecords.length === 0) {
      console.log(`L'utilisateur avec l'ID ${userId} n'est pas de type ${userType}`);
      throw new Error(`L'utilisateur spécifié n'est pas de type ${userType}.`);
    }

    console.log(`Validation réussie pour l'utilisateur ID : ${userId}, Type : ${userType}`);
  } catch (error) {
    console.error(`Erreur lors de la validation du type utilisateur : ${error.message}`);
    throw error;
  }
}

async validateUserTypeForCompensation(userId: string, allowedTypes: string[] | string): Promise<void> {
  try {
    const typesArray = Array.isArray(allowedTypes) ? allowedTypes : [allowedTypes];
    const typesFormula = typesArray.map(type => `{type_utilisateur} = '${type}'`).join(', ');

    const formula = `AND({id} = '${userId}', OR(${typesFormula}))`;

    console.log(`Validation du type utilisateur pour l'ID : ${userId}, Types autorisés : ${typesArray.join(', ')}`);
    
    const userRecords = await this.base('Utilisateurs')
      .select({ filterByFormula: formula })
      .firstPage();

    if (userRecords.length === 0) {
      console.log(`Aucun utilisateur correspondant trouvé pour l'ID ${userId} avec les types spécifiés : ${typesArray.join(', ')}`);
      throw new Error(`L'utilisateur spécifié n'a pas un type autorisé (${typesArray.join(', ')}).`);
    }

    console.log(`Validation réussie pour l'utilisateur ID : ${userId}, Type valide`);
  } catch (error) {
    console.error(`Erreur lors de la validation du type utilisateur : ${error.message}`);
    throw error;
  }
}

async validateSolde(userId: string, montant: number): Promise<void> {
  try {
    console.log(`Validation du solde pour l'utilisateur ID : ${userId}, Montant requis : ${montant}`);
    const userRecords = await this.base('Utilisateurs')
      .select({ filterByFormula: `{id} = '${userId}'` })
      .firstPage();

    if (userRecords.length === 0) {
      console.log(`Aucun utilisateur trouvé avec l'ID : ${userId}`);
      throw new Error('Utilisateur introuvable.');
    }

    const solde = userRecords[0].fields.solde || 0;
    console.log(`Solde actuel de l'utilisateur ID ${userId} : ${solde}`);

    if (solde < montant) {
      console.log(`Solde insuffisant pour l'utilisateur ID : ${userId}`);
      throw new Error('Solde insuffisant pour effectuer cette opération.');
    }

    console.log(`Validation du solde réussie pour l'utilisateur ID : ${userId}`);
  } catch (error) {
    console.error(`Erreur lors de la validation du solde : ${error.message}`);
    throw error;
  }
}

// Méthode pour ettre à jour le solde de l'utilisateur
async updateSolde(userId: string, newSolde: number): Promise<void> {
  try {
    // Vérifier que l'utilisateur existe
    const userRecords = await this.base('Utilisateurs')
      .select({ filterByFormula: `{id} = '${userId}'` })
      .firstPage();

    if (userRecords.length === 0) {
      throw new Error('Utilisateur introuvable.');
    }

    // Mettre à jour le solde de l'utilisateur
    await this.base('Utilisateurs').update(userId, { solde: newSolde });
  } catch (error) {
    throw new Error(`Erreur lors de la mise à jour du solde : ${error.message}`);
  }
}

// Selectionner tous les utilisateurs
async getAllUsers() {
  const records = await this.base('Utilisateurs').select().all();
  return records.map((record) => {
    const fields = record.fields;
    // Exclure les données sensibles comme mot_de_passe
    delete fields.mot_de_passe;
    delete fields.PIN;
    delete fields.pays_id; 
    delete fields.master_id;
    delete fields.destinataire; 
    delete fields.expediteur; 
    delete fields.CodesRecharge; 
    delete fields.recharge_master; 
    delete fields.OTP; 
 

    return { id: record.id, ...fields };
  });
}
// méthode pour modifier les détails d'un utilisateur
async updateUser(id: string, updatedData: any, files?: Express.Multer.File[]): Promise<any> {
  try {
    // Filtrer les données pour inclure uniquement les champs autorisés
    /*const filteredData = {};
    for (const field of this.allowedFields) {
      if (updatedData[field] !== undefined) {
        filteredData[field] = updatedData[field];
      }
    }*/
  // Vérifiez que le statut du pays est "Activated"
  if (updatedData.pays_id) {
  await this.checkCountryStatus(updatedData.pays_id);
  updatedData.pays_id = [updatedData.pays_id];
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
      // Remplacer le champ photo_url par les URLs des images uploadées
      updatedData.photo_url = uploadedImages.map(url => ({ url }));
    } else if (updatedData.photo_url) {
      // Si photo_url est une chaîne (URL), convertissez-la en tableau d'objets
      if (typeof updatedData.photo_url === 'string') {
        updatedData.photo_url = [{ url: updatedData.photo_url }];
      }
      // Si photo_url est un tableau de chaînes, convertissez chaque élément
      else if (Array.isArray(updatedData.photo_url)) {
        updatedData.photo_url = updatedData.photo_url.map(url => ({ url }));
      }
    }
      // Mettez à jour l'utilisateur dans Airtable
      /*const response = await axios.patch(
        `${this.getUrl()}/${id}`,
        { fields: updatedData },
        { headers: this.getHeaders() }
      );*/  
    await this.base('Utilisateurs').update(id, updatedData);
  
  return { message: 'Utilisateur mis à jour avec succès.' };
  } catch (error) {
  throw new Error(`Erreur lors de la mise à jour de l'utilisateur : ${error.message}`);
  }
  }

// delete
async deleteUser(id: string) {
  try {
    await this.base('Utilisateurs').destroy(id);
    
    // Enregistrer un log
    /*await this.auditLogService.createLog(
      userId,
      'DELETE',
      'Utilisateur',
      id,
      {}
    );*/

    return { message: 'Utilisateur supprimé avec succès.' };
  } catch (error) {
    throw new Error(`Erreur lors de la suppression de l'utilisateur : ${error.message}`);
  }
}

//Generer un nouveau PIN
async generateNewPIN(id: string): Promise<string> {
  const newPIN = Math.floor(10000 + Math.random() * 90000).toString();
  const hashedPIN = await bcrypt.hash(newPIN, 10);

  try {
    await this.base('Utilisateurs').update(id, { PIN: hashedPIN });
    return newPIN; // Retournez le nouveau PIN en clair
  } catch (error) {
    throw new Error(`Erreur lors de la mise à jour du PIN : ${error.message}`);
  }
}

// Renvoie de PIN
async sendPINToUser(numero_compte: string) {
  const user = await this.getUserByNumeroCompte(numero_compte);

  // Vérifiez que le statut du pays est "Activated"
  await this.checkCountryStatus(user.pays_id); 

  // Vérifier le statut du compte
  await this.checkUserStatus(numero_compte);

  const newPIN = await this.generateNewPIN(user.id);

  try {
    await this.mailService.sendPINMail(
      user.email, user.name, user.numero_compte, newPIN
    );

    // Réinitialiser les tentatives infructueuses en cas de succès
    await this.resetFailedAttempts(numero_compte);

    return { message: 'Un nouveau code PIN a été envoyé à votre adresse email.' };
  } catch (error) {
    // Incrémenter les tentatives infructueuses en cas d'échec
    await this.incrementFailedAttempts(numero_compte);
    throw new Error('Erreur lors de l\'envoi du code PIN.');
  }
}

//Changement de code PIN
async changePIN(userId: string, oldPIN: string, newPIN: string): Promise<void> {
  console.log('ID de l\'utilisateur reçu dans le service :', userId);

  // Récupérer l'utilisateur par son ID
  const user = await this.getUserById(userId); // Les données retournées incluent maintenant `mot_de_passe`

  // Vérifiez que le statut du pays est "Activated"
  await this.checkCountryStatus(user.pays_id); 

  // Vérifier que l'ancien mot de passe est correct
  const isOldPINValid = await bcrypt.compare(oldPIN, user.PIN);
  if (!isOldPINValid) {
    throw new Error('L\'ancien code PIN est incorrect.');
  }

  // Hacher le nouveau code PIN
  const hashedNewPIN = await bcrypt.hash(newPIN, 10);

  // Mettre à jour le code PIN dans Airtable
  try {
    await this.base('Utilisateurs').update(userId, { PIN: hashedNewPIN });
  } catch (error) {
    throw error; //(`Erreur lors du changement de mot de passe : ${error.message}`);
  }
}

// Vérification du statut d'un utilisateur
async checkUserStatus(numero_compte: string): Promise<void> {
  console.log(`Vérification du statut pour le numéro de compte : ${numero_compte}`);
  const user = await this.getUserByNumeroCompte(numero_compte);

  if (user.status === 'Deactivated') {
    throw new Error('Votre compte a été bloqué.');
  }
  console.log(`Statut validé avec succès pour le numéro de compte : ${numero_compte}`);
}
async checkUserStatusMaster(numero_compte: string): Promise<void> {
  console.log(`Vérification du statut pour le numéro de compte : ${numero_compte}`);
  const user = await this.getUserByNumeroCompte(numero_compte);

  if (user.status === 'Deactivated') {
    throw new Error('Le compte Master a été bloqué.');
  }
  console.log(`Statut validé avec succès pour le numéro de compte : ${numero_compte}`);
}
async checkUserStatusMarchand(numero_compte: string): Promise<void> {
  console.log(`Vérification du statut pour le numéro de compte : ${numero_compte}`);
  const user = await this.getUserByNumeroCompte(numero_compte);

  if (user.status === 'Deactivated') {
    throw new Error('Le compte Marchand a été bloqué.');
  }
  console.log(`Statut validé avec succès pour le numéro de compte : ${numero_compte}`);
}



async incrementFailedAttempts(numero_compte: string): Promise<void> {
  const user = await this.getUserByNumeroCompte(numero_compte);

  const newAttempts = (user.tentatives_echec || 0) + 1;

  if (newAttempts >= 3) {
    // Bloquer le compte
    await this.base('Utilisateurs').update(user.id, { status: 'Deactivated', tentatives_echec: newAttempts });
    throw new Error('Votre compte a été bloqué après 3 tentatives infructueuses.');
  }

  // Mettre à jour le nombre de tentatives
  await this.base('Utilisateurs').update(user.id, { tentatives_echec: newAttempts });
}

// src/users/users.service.ts
async resetFailedAttempts(numero_compte: string): Promise<void> {
  try {
    const user = await this.getUserByNumeroCompte(numero_compte);

    // Vérifier que le champ existe
    /*if (!user.tentatives_echec) {
      throw new Error('Le champ tentatives_echec n\'existe pas pour cet utilisateur.');
    }*/

    // Réinitialiser les tentatives infructueuses à 0
    await this.base('Utilisateurs').update(user.id, { tentatives_echec: 0 });
    
      // Vérifier que la mise à jour a réussi
      const updatedUser = await this.getUserByNumeroCompte(numero_compte);
      if (updatedUser.tentatives_echec !== 0) {
        throw new Error('Échec de la réinitialisation des tentatives infructueuses.');
      }
    }
    catch (error) {
    throw new Error(`Erreur lors de la réinitialisation des tentatives infructueuses : ${error.message}`);
    }
}


// Débloquer un compte
async unlockUser(numero_compte: string) {
  const user = await this.getUserByNumeroCompte(numero_compte);

  // Vérifiez que le statut du pays est "Activated"
  await this.checkCountryStatus(user.pays_id); 
  
  if (user.status === 'Activated') {
    throw new Error('Le compte est déjà activé.');
  }

  await this.base('Utilisateurs').update(user.id, { status: 'Activated', tentatives_echec: 0 });
  return { message: 'Le compte a été débloqué avec succès.' };
}

async blockUser(numero_compte: string): Promise<void> {
  const user = await this.getUserByNumeroCompte(numero_compte);

  if (user.status === 'Deactivated') {
    throw new Error('Le compte est déjà bloqué.');
  }

  // Bloquer le compte
  await this.base('Utilisateurs').update(user.id, { status: 'Deactivated' });
}

// Génération de mot de passe
async generateNewPassword(id: string): Promise<string> {
  const newPassword = Math.random().toString(36).substring(2, 10); // Génère un mot de passe aléatoire
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  try {
    await this.base('Utilisateurs').update(id, { mot_de_passe: hashedPassword });
    return newPassword; // Retourne le mot de passe en clair pour l'email
  } catch (error) {
    throw new Error(`Erreur lors de la mise à jour du mot de passe : ${error.message}`);
  }
}

async sendPasswordToUser(numero_compte: string) {
  const user = await this.getUserByNumeroCompte(numero_compte);

  // Vérifiez que le statut du pays est "Activated"
  await this.checkCountryStatus(user.pays_id); 

  // Vérifier le statut du compte
  await this.checkUserStatus(numero_compte);

  // Générer un nouveau mot de passe temporaire
  const newPassword = await this.generateNewPassword(user.id);

  // Envoyer le mot de passe par email
  const emailContent = `
    Bonjour ${user.nom} ${user.prenom},
    
    Voici votre nouveau mot de passe temporaire : ${newPassword}.
    
    Conservez ce mot de passe en sécurité. Il est nécessaire pour accéder à votre compte.
  `;

  await this.mailService.sendMail(
    user.email,
    'Récupération de votre mot de passe',
    emailContent
  );

  return { message: 'Un nouveau mot de passe a été envoyé à votre adresse email.' };
}

//Changement de mot de passe 
async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
  console.log('ID de l\'utilisateur reçu dans le service :', userId);

  // Récupérer l'utilisateur par son ID
  const user = await this.getUserById(userId); // Les données retournées incluent maintenant `mot_de_passe`

  // Vérifiez que le statut du pays est "Activated"
  await this.checkCountryStatus(user.pays_id); 

  // Vérifier que l'ancien mot de passe est correct
  const isOldPasswordValid = await bcrypt.compare(oldPassword, user.mot_de_passe);
  if (!isOldPasswordValid) {
    throw new Error('L\'ancien mot de passe est incorrect.');
  }

  // Hacher le nouveau mot de passe
  const hashedNewPassword = await bcrypt.hash(newPassword, 10);

  // Mettre à jour le mot de passe dans Airtable
  try {
    await this.base('Utilisateurs').update(userId, { mot_de_passe: hashedNewPassword });
  } catch (error) {
    throw error; //(`Erreur lors du changement de mot de passe : ${error.message}`);
  }
}
// Vérification du status d'un pays
async checkCountryStatus(countryId: string): Promise<void> {
  const country = await this.base('Pays')
    .find(countryId)
    .catch(() => {
      throw new Error('Erreur lors de la récupération du pays.');
    });

  if (!country || !country.fields.status) {
    throw new Error('Le pays sélectionné est introuvable ou n\'a pas de statut défini.');
  }

  if (country.fields.status !== 'Activated') {
    throw new Error('Les activités sont suspendues dans ce pays momentanément.');
  }
}

// Vérification du status du pays d'un utilisateur
async checkCountryStatusForUser(userId: string): Promise<void> {
  const user = await this.getUserById(userId);

  if (!user.pays_id || user.pays_id.length === 0) {
    throw new Error('Aucun pays associé à cet utilisateur.');
  }

  const countryId = user.pays_id[0]; // Récupérez l'ID du pays depuis le champ pays_id
  const country = await this.base('Pays')
    .find(countryId)
    .catch(() => {
      throw new Error('Erreur lors de la récupération du pays.');
    });

  if (!country || !country.fields.status) {
    throw new Error('Le pays associé à cet utilisateur est introuvable ou n\'a pas de statut défini.');
  }

  if (country.fields.status !== 'Activated') {
    throw new Error('Le pays associé à votre compte n\'est pas activé.');
  }
}
// Vérification du status du pays d'un utilisateur
async checkCountryStatusForClient(userId: string): Promise<void> {
  const user = await this.getUserById(userId);

  if (!user.pays_id || user.pays_id.length === 0) {
    throw new Error('Aucun pays associé au client.');
  }

  const countryId = user.pays_id[0]; // Récupérez l'ID du pays depuis le champ pays_id
  const country = await this.base('Pays')
    .find(countryId)
    .catch(() => {
      throw new Error('Erreur lors de la récupération du pays.');
    });

  if (!country || !country.fields.status) {
    throw new Error('Le pays associé au client est introuvable ou n\'a pas de statut défini.');
  }

  if (country.fields.status !== 'Activated') {
    throw new Error('Le pays associé au compte client n\'est pas activé.');
  }
}
// Vérification du status du pays d'un utilisateur Marchand
async checkCountryStatusForMarchand(userId: string): Promise<void> {
  const user = await this.getUserById(userId);

  if (!user.pays_id || user.pays_id.length === 0) {
    throw new Error('Aucun pays associé au Marchand.');
  }

  const countryId = user.pays_id[0]; // Récupérez l'ID du pays depuis le champ pays_id
  const country = await this.base('Pays')
    .find(countryId)
    .catch(() => {
      throw new Error('Erreur lors de la récupération du pays.');
    });

  if (!country || !country.fields.status) {
    throw new Error('Le pays associé au Marchand est introuvable ou n\'a pas de statut défini.');
  }

  if (country.fields.status !== 'Activated') {
    throw new Error('Le pays associé au compte du Marchand n\'est pas activé.');
  }
}

// vérifier que le code marchand généré est unique 
async isMerchantCodeUnique(merchantCode: string): Promise<boolean> {
  const records = await this.base('Utilisateurs')
    .select({ filterByFormula: `{code_marchand} = '${merchantCode}'` })
    .firstPage();

  return records.length === 0;
}

// méthode pour générer un code marchand unique de 6 chiffres
async generateUniqueMerchantCode(): Promise<string> {
  let merchantCode: string | null = null; // Initialisée à null
  let isUnique = false;

  while (!isUnique) {
    merchantCode = Math.floor(100000 + Math.random() * 900000).toString(); // Génère un nombre aléatoire à 6 chiffres
    isUnique = await this.isMerchantCodeUnique(merchantCode);
  }
  if (!merchantCode) {
    throw new Error('Impossible de générer un code marchand unique.');
  }

  return merchantCode;
}

// vérifier l'existence du code_marchand, le statut du Master 
async validateMerchantCode(merchantCode: string): Promise<any> {
  // Récupérer le Master associé au code marchand
  const masterRecords = await this.base('Utilisateurs')
    .select({ filterByFormula: `{code_marchand} = '${merchantCode}'` })
    .firstPage();

  if (masterRecords.length === 0) {
    throw new Error('Le code marchand est invalide.');
  }

  const master = masterRecords[0].fields;

  // Vérifier que le Master est activé
  if (master.status !== 'Activated') {
    throw new Error('Le Master associé au code marchand n\'est pas activé.');
  }

  // Vérifier que le pays du Master est activé
  const countryId = master.pays_id[0]; // Récupérez l'ID du pays depuis le champ pays_id
  const country = await this.base('Pays').find(countryId);

  if (!country || country.fields.status !== 'Activated') {
    throw new Error('Le pays du Master n\'est pas activé.');
  }

  return master;
}

// récupérer tous les utilisateurs de type MARCHAND associés à un MASTER spécifique
async getMarchandsByMaster(masterId: string): Promise<any[]> {
  // Vérifier que le Master existe
  const master = await this.getUserById(masterId);

  if (master.type_utilisateur !== 'MASTER') {
    throw new Error('L\'ID fourni ne correspond pas à un utilisateur de type MASTER.');
  }

  // Récupérer tous les Marchands associés au Master
  const marchandRecords = await this.base('Utilisateurs')
    .select({ filterByFormula: `{master_id} = '${masterId}'` })
    .all()

  return marchandRecords.map((record) => ({
    
    /*const fields = marchandRecords.fields;
    // Exclure les données sensibles comme mot_de_passe
    delete fields.mot_de_passe;
    delete fields.PIN;*/
    
    id: record.id,
    ...record.fields,
  }));
}

// Méthode pour récupérer le Master associé à un Marchand.
async getMasterByMarchand(marchandId: string): Promise<any> {
  try {
    console.log(`Recherche du Master pour le Marchand ID : ${marchandId}`);

    //const marchandRecord = await this.getUserById(marchandId);
    const marchandRecord = await this.base('Utilisateurs').find(marchandId);
    const masterId = marchandRecord.fields.master_id;

    if (!masterId) {
      throw new Error("Ce Marchand n'est pas rattaché à un Master.");
    }

    const masterRecord = await this.getUserById(masterId);
    console.log(`Master trouvé pour le Marchand ID ${marchandId} :`, masterRecord);
    return masterRecord;
  } catch (error) {
    console.error(`Erreur lors de la recherche du Master : ${error.message}`);
    throw error;
  }
}

/*async getMasterByMarchand(marchandId: string): Promise<any> {
  try {
    console.log(`Récupération du Master pour le Marchand ID : ${marchandId}`);
    
    // D'abord, on récupère le marchand pour obtenir son master_id
    const marchandRecord = await this.base('Utilisateurs').find(marchandId);
    
    if (!marchandRecord || marchandRecord.fields.type_utilisateur !== 'MARCHAND') {
      throw new Error('Marchand non trouvé ou type utilisateur invalide');
    }

    const masterId = marchandRecord.fields.master_id;
    if (!masterId) {
      throw new Error('Ce marchand n\'est associé à aucun master');
    }

    // Ensuite, on récupère le master correspondant
    const masterRecord = await this.base('Utilisateurs').find(masterId);
    
    if (!masterRecord || masterRecord.fields.type_utilisateur !== 'MASTER') {
      throw new Error('Master non trouvé ou type utilisateur invalide');
    }

    const master = { id: masterRecord.id, ...masterRecord.fields };
    console.log(`Master trouvé pour le Marchand ID ${marchandId} :`, master);
    return master;
    
  } catch (error) {
    console.error(`Erreur lors de la récupération du Master pour le Marchand ID ${marchandId} :`, error.message);
    throw new Error(`Erreur lors de la récupération du Master pour le Marchand ID ${marchandId} : ${error.message}`);
  }
}*/

// Méthode pour récupérer uniquement les utilisateurs de type MASTER .
async getAllMasters() {
  console.log('Début de la méthode getAllMasters');
  try {
    const records = await this.base('Utilisateurs').select().all();
    console.log('Records récupérés :', records);

    const masters = records
      .filter((record) => record.type_utilisateur === 'MASTER')
      .map((record) => {
        const fields = record;
        delete fields.mot_de_passe;
        return { id: record.id, ...fields };
      });

    console.log('Masters filtrés :', masters);
    return masters;
  } catch (error) {
    console.error('Erreur dans getAllMasters :', error.message);
    throw new Error(`Erreur lors de la récupération des utilisateurs de type MASTER : ${error.message}`);
  }
}
// méthode pour partager les commissions Retrait en tenant compte des règles métier spécifiques.
async shareCommissions(typeOperation: string, paysId: string, montantFrais: number, marchandNumeroCompte: string, compteSysteme: any): Promise<void> {
  try {
    console.log(`Partage des commissions pour l'opération : ${typeOperation}`);

    // Récupérer les configurations de commissionnement pour l'opération et le pays
    const commissions = await this.commissionsService.getCommissionsByOperation(typeOperation, paysId);
    console.log(`Les enregistrements récupérés pour l'opération ${typeOperation} du pays ${paysId} : ${commissions}`);

    // Récupérer le compte ADMIN
    const adminRecord = await this.getAdminAccount();
    console.log(`les données de ADMIN trouvées : ${adminRecord}`);

    // Récupérer le compte du GOUVERNEMENT
    const taxeRecord = await this.getTaxeAccount();
    console.log(`les données du GOUVERNEMENT trouvées : ${taxeRecord}`);


    // Récupérer le Marchand
    const marchandRecord = await this.getUserByNumeroCompte(marchandNumeroCompte);
    console.log(`les données du Marchand trouvées : ${marchandRecord}`);


    // Récupérer le Master associé au Marchand
    const masterRecord = await this.getMasterByMarchand(marchandRecord.id);
    //const masterRecord = marchandRecord.master_id;
    console.log(`le Master rattaché au Marchand trouvé : ${masterRecord}`);

    const deviseCode = marchandRecord.devise_code?.[0] || 'XOF'; // Récupérer la devise du pays 
    const pays = marchandRecord.nom_pays?.[0] || ''; // Récupérer le nom du pays 

    // Partager les commissions entre les acteurs
    for (const commission of commissions) {
      const typeUtilisateur = commission.fields.typeUtilisateur;
      const pourcentage = commission.fields.pourcentage;
      const part = (montantFrais * pourcentage) / 100;
      
      //let destinataireId: string | null = null;
      let destinataireId: string = ""; // Initialisation avec une chaîne vide
      let description = '';

      switch (typeUtilisateur) {
        case 'ADMIN':
          //await this.updateSolde(adminRecord.id, (adminRecord.solde || 0) + part);
          destinataireId = adminRecord.id;
          //description = `Commission de ${part} ${deviseCode} ajoutée au solde de l'ADMIN sur opération de ${typeOperation} au ${pays}`;
          description = `${part} ${deviseCode} débité du compte système(${compteSysteme.fields.numCompte}) pour commission sur opération de ${typeOperation} au compte OPERATEUR TECHNIQUE effectuée au ${pays}`;
          break;

        case 'TAXE':
        //await this.updateSolde(taxeRecord.id, (taxeRecord.solde || 0) + part);
        destinataireId = taxeRecord.id;
        //description = `Commission de ${part} ${deviseCode} ajoutée au solde du GOUVERNEMENT sur opération de ${typeOperation} au ${pays}`;
        description = `${part} ${deviseCode} débité du compte système(${compteSysteme.fields.numCompte}) pour commission sur opération de ${typeOperation} au compte du GOUVERNEMENT effectuée au ${pays}`;
        break;

        case 'MARCHAND':
          //await this.updateSolde(marchandRecord.id, (marchandRecord.solde || 0) + part);
          destinataireId = marchandRecord.id;
          //description = `Commission de ${part} ${deviseCode} ajoutée au solde du Marchand(${marchandRecord.numero_compte}) sur opération de ${typeOperation}`;
          description = `${part} ${deviseCode} débité du compte système(${compteSysteme.fields.numCompte}) pour commission sur opération de ${typeOperation} au compte du Marchand(${marchandRecord.numero_compte}) effectuée au ${pays}`;
          break;

        case 'MASTER':
          //await this.updateSolde(masterRecord.id, (masterRecord.solde || 0) + part);
          destinataireId = masterRecord.id;
          //description = `Commission de ${part} ${deviseCode} ajoutée au solde du Master(${masterRecord.numero_compte}) sur opération de ${typeOperation} `;
          description = `${part} ${deviseCode} débité du compte système(${compteSysteme.fields.numCompte}) pour commission sur opération de ${typeOperation} au compte du Master(${masterRecord.numero_compte}) effectuée au ${pays}`;
          break;

        default:
          console.warn(`Type d'utilisateur inconnu : ${typeUtilisateur}`);
          //break;
          continue; // Ignorer ce type d'utilisateur

      }
      // Mettre à jour le solde de l'acteur
      const destinataireRecord = await this.getUserById(destinataireId);
      const nouveauSoldeDestinataire = (destinataireRecord.solde || 0) + part;
      await this.updateSolde(destinataireId, nouveauSoldeDestinataire);

      // Créer une transaction pour cette commission
      await this.transactionsService.createCommissionTransaction(
        part,
        compteSysteme.id,
        destinataireId,
        description
      );
      console.log(`le compte systeme trouvé : ${compteSysteme.fields.id}`);
      await this.compteSystemeService.debiterCompteSysteme(compteSysteme.fields.id, part);
      console.log(`Part ajoutée au solde de l'acteur : ${typeUtilisateur}, Montant : ${part}`);
    }
        // Débiter le compte système
        /*const nouveauSoldeCompteSysteme = (compteSysteme.fields.solde || 0) - montantFrais;
        await this.compteSystemeService.updateSoldeSysteme(compteSysteme.fields.id, nouveauSoldeCompteSysteme);*/


  } catch (error) {
    console.error(`Erreur lors du partage des commissions : ${error.message}`);
    throw error;
  }
}

async shareCommissionsDepotInter(typeOperation: string, paysId: string, montantFrais: number, marchandNumeroCompte: string, compteSysteme: any): Promise<void> {
  try {
    console.log(`Partage des commissions pour l'opération : ${typeOperation}`);

    // Récupérer les configurations de commissionnement pour l'opération et le pays
    const commissions = await this.commissionsService.getCommissionsByOperation(typeOperation, paysId);
    console.log(`Les enregistrements récupérés pour l'opération ${typeOperation} du pays ${paysId} : ${commissions}`);

    // Récupérer le compte ADMIN
    const adminRecord = await this.getAdminAccount();
    console.log(`les données de ADMIN trouvées : ${adminRecord}`);

    // Récupérer le Marchand
    const marchandRecord = await this.getUserByNumeroCompte(marchandNumeroCompte);
    console.log(`les données du Marchand trouvées : ${marchandRecord}`);


    // Récupérer le Master associé au Marchand
    const masterRecord = await this.getMasterByMarchand(marchandRecord.id);
    //const masterRecord = marchandRecord.master_id;
    console.log(`le Master rattaché au Marchand trouvé : ${masterRecord}`);

    const deviseCode = marchandRecord.devise_code?.[0] || 'XOF'; // Récupérer la devise du pays 
    const pays = marchandRecord.nom_pays?.[0] || ''; // Récupérer le nom du pays 

    // Partager les commissions entre les acteurs
    for (const commission of commissions) {
      console.log('solde compte systeme :', compteSysteme.fields.solde);
      if(compteSysteme.fields.solde<0){throw new BadRequestException("solde compte systeme insuffisant");}
      const typeUtilisateur = commission.fields.typeUtilisateur;
      const pourcentage = commission.fields.pourcentage;
      const part = (montantFrais * pourcentage) / 100;
      
      //let destinataireId: string | null = null;
      let destinataireId: string = ""; // Initialisation avec une chaîne vide
      let description = '';

      switch (typeUtilisateur) {
        case 'ADMIN':
          //await this.updateSolde(adminRecord.id, (adminRecord.solde || 0) + part);
          destinataireId = adminRecord.id;
          //description = `Commission de ${part} ${deviseCode} ajoutée au solde de l'ADMIN sur opération de ${typeOperation} au ${pays}`;
          description = `${part} ${deviseCode} débité du compte système(${compteSysteme.fields.numCompte}) pour commission sur opération de ${typeOperation} au compte OPERATEUR TECHNIQUE effectuée au ${pays}`;
          break;

        /*case 'TAXE':
        //await this.updateSolde(taxeRecord.id, (taxeRecord.solde || 0) + part);
        destinataireId = taxeRecord.id;
        //description = `Commission de ${part} ${deviseCode} ajoutée au solde du GOUVERNEMENT sur opération de ${typeOperation} au ${pays}`;
        description = `${part} ${deviseCode} débité du compte système(${compteSysteme.fields.numCompte}) pour commission sur opération de ${typeOperation} au compte du GOUVERNEMENT effectuée au ${pays}`;
        break;*/

        case 'MARCHAND':
          //await this.updateSolde(marchandRecord.id, (marchandRecord.solde || 0) + part);
          destinataireId = marchandRecord.id;
          //description = `Commission de ${part} ${deviseCode} ajoutée au solde du Marchand(${marchandRecord.numero_compte}) sur opération de ${typeOperation}`;
          description = `${part} ${deviseCode} débité du compte système(${compteSysteme.fields.numCompte}) pour commission sur opération de ${typeOperation} au compte du Marchand(${marchandRecord.numero_compte}) effectuée au ${pays}`;
          break;

        case 'MASTER':
          //await this.updateSolde(masterRecord.id, (masterRecord.solde || 0) + part);
          destinataireId = masterRecord.id;
          //description = `Commission de ${part} ${deviseCode} ajoutée au solde du Master(${masterRecord.numero_compte}) sur opération de ${typeOperation} `;
          description = `${part} ${deviseCode} débité du compte système(${compteSysteme.fields.numCompte}) pour commission sur opération de ${typeOperation} au compte du Master(${masterRecord.numero_compte}) effectuée au ${pays}`;
          break;

        default:
          console.warn(`Type d'utilisateur inconnu : ${typeUtilisateur}`);
          //break;
          continue; // Ignorer ce type d'utilisateur

      }
      // Mettre à jour le solde de l'acteur
      const destinataireRecord = await this.getUserById(destinataireId);
      const nouveauSoldeDestinataire = (destinataireRecord.solde || 0) + part;
      await this.updateSolde(destinataireId, nouveauSoldeDestinataire);

      // Créer une transaction pour cette commission
      await this.transactionsService.createCommissionTransaction(
        part,
        compteSysteme.id,
        destinataireId,
        description
      );
      console.log(`le compte systeme trouvé : ${compteSysteme.fields.id}`);
      await this.compteSystemeService.debiterCompteSysteme(compteSysteme.fields.id, part);
      console.log(`Part ajoutée au solde de l'acteur : ${typeUtilisateur}, Montant : ${part}`);
    }
        // Débiter le compte système
        /*const nouveauSoldeCompteSysteme = (compteSysteme.fields.solde || 0) - montantFrais;
        await this.compteSystemeService.updateSoldeSysteme(compteSysteme.fields.id, nouveauSoldeCompteSysteme);*/

  } catch (error) {
    console.error(`Erreur lors du partage des commissions : ${error.message}`);
    throw error;
  }
}

// méthode pour partager les commissions Depot en tenant compte des règles métiers spécifiques.
async shareCommissionsDepot(typeOperation: string, paysId: string, montant: number, marchandNumeroCompte: string, compteSysteme: any): Promise<void> {
  try {
    console.log(`Partage des commissions pour l'opération : ${typeOperation}`);

    // Récupérer les configurations de commissionnement pour l'opération et le pays
    const commissions = await this.commissionsService.getCommissionsByOperation(typeOperation, paysId);
    console.log(`Les enregistrements récupérés pour l'opération ${typeOperation} du pays ${paysId} : ${commissions}`);

    // Récupérer le Marchand
    const marchandRecord = await this.getUserByNumeroCompte(marchandNumeroCompte);
    console.log(`les données du Marchand trouvées : ${marchandRecord}`);

    const deviseCode = marchandRecord.devise_code?.[0] || 'XOF'; // Récupérer la devise du pays 
    const pays = marchandRecord.nom_pays?.[0] || ''; // Récupérer le nom du pays 

    // Partager les commissions entre les acteurs
    for (const commission of commissions) {
      const typeUtilisateur = commission.fields.typeUtilisateur;
      const pourcentage = commission.fields.pourcentage;
      const part = (montant * pourcentage) / 100;
      
      //let destinataireId: string | null = null;
      let destinataireId: string = ""; // Initialisation avec une chaîne vide
      let description = '';

      switch (typeUtilisateur) {

        case 'MARCHAND':
          //await this.updateSolde(marchandRecord.id, (marchandRecord.solde || 0) + part);
          destinataireId = marchandRecord.id;
          description = `${part} ${deviseCode} débité du compte système (${compteSysteme.fields.numCompte}) pour commission sur opération de ${typeOperation} au Marchand(${marchandRecord.numero_compte}) effectuée au ${pays}`;
          break;

        default:
          console.warn(`Type d'utilisateur inconnu : ${typeUtilisateur}`);
          //break;
          continue; // Ignorer ce type d'utilisateur

      }
      // Mettre à jour le solde de l'acteur
      const destinataireRecord = await this.getUserById(destinataireId);
      const nouveauSoldeDestinataire = (destinataireRecord.solde || 0) + part;
      await this.updateSolde(destinataireId, nouveauSoldeDestinataire);

      // Créer une transaction pour cette commission
      await this.transactionsService.createCommissionTransaction(
        part,
        compteSysteme.id,
        destinataireId,
        description
      );
        // Débiter le compte système
        console.log(`le compte systeme trouvé : ${compteSysteme.fields.id}`);
        await this.compteSystemeService.debiterCompteSysteme(compteSysteme.fields.id, part);

      console.log(`Part ajoutée au solde de l'acteur : ${typeUtilisateur}, Montant : ${part}`);
    }

  } catch (error) {
    console.error(`Erreur lors du partage des commissions : ${error.message}`);
    throw error;
  }
}

// Méthode pour récupérer le compte ADMIN.
async getAdminAccount(): Promise<any> {
  try {
    console.log('Recherche du compte ADMIN...');

    const adminRecords = await this.base('Utilisateurs')
      .select({ filterByFormula: `{type_utilisateur} = 'ADMIN'` })
      .firstPage();

    if (adminRecords.length === 0) {
      throw new Error("Aucun compte ADMIN trouvé.");
    }

    console.log(`Compte ADMIN trouvé :`, adminRecords[0]);
    return adminRecords[0];
  } catch (error) {
    console.error(`Erreur lors de la recherche du compte ADMIN : ${error.message}`);
    throw error;
  }
}

// Méthode pour récupérer le compte ADMIN.
async getTaxeAccount(): Promise<any> {
  try {
    console.log('Recherche du compte ADMIN...');

    const taxeRecords = await this.base('Utilisateurs')
      .select({ filterByFormula: `{type_utilisateur} = 'TAXE'` })
      .firstPage();

    if (taxeRecords.length === 0) {
      throw new Error("Aucun compte TAXE trouvé.");
    }

    console.log(`Compte TAXE trouvé :`, taxeRecords[0]);
    return taxeRecords[0];
  } catch (error) {
    console.error(`Erreur lors de la recherche du compte ADMIN : ${error.message}`);
    throw error;
  }
}

// Méthode pour récupérer les Marchands associés à un Master spécifique.
async getMarchandsByMasterId(masterId: string): Promise<any[]> {
  try {
    console.log(`Récupération des Marchands pour le Master ID : ${masterId}`);
    const records = await this.base('Utilisateurs').select().all();

    // Filtrer les Marchands associés au Master spécifié
    const marchands = records
      .filter(
        (record) =>
          record.fields.type_utilisateur === 'MARCHAND' &&
          record.fields.master_id === masterId
      )
      .map((record) => {
        const fields = record.fields;
        return { id: record.id, ...fields };
      });

    console.log(`Marchands trouvés pour le Master ID ${masterId} :`, marchands);
    return marchands;
  } catch (error) {
    console.error(`Erreur lors de la récupération des Marchands pour le Master ID ${masterId} :`, error.message);
    throw new Error(`Erreur lors de la récupération des Marchands pour le Master ID ${masterId} : ${error.message}`);
  }
}
//  méthode pour créditer le solde d'un utilisateur (Master).
async creditSolde(userId: string, montant: number) {
  const userRecords = await this.base('Utilisateurs')
    .select({ filterByFormula: `{id} = '${userId}'` })
    .firstPage();

  if (userRecords.length === 0) {
    throw new Error('Utilisateur introuvable.');
  }

  const userRecord = userRecords[0];
  const currentSolde = userRecord.fields.solde || 0;
  const newSolde = currentSolde + montant;

  // Mettre à jour le solde de l'utilisateur
  await this.base('Utilisateurs').update(userRecord.id, { solde: newSolde });

  return { solde: newSolde };
}
  // Méthode pour générer un code OTP et l'envoyer par e-mail.
  async validateAgripayOTP(userId: string, operation_id: string, otpCode: string): Promise<boolean> {
    // Récupérer le code OTP associé à l'utilisateur
    const otpRecords = await this.base('OTP')
      .select({
        filterByFormula: `AND({user_id} = '${userId}', {operation_id} = '${operation_id}', {code} = '${otpCode}', {used} = 'false')`,
      })
      .firstPage();
  
    if (otpRecords.length === 0) {
      throw new Error('Données envoyées invalides ou code OTP déjà utilisé.');

    }
  
    const otpRecord = otpRecords[0];
    const expiresAt = new Date(otpRecord.fields.expires_at);
  
    // Vérifier si le code OTP est expiré
    if (expiresAt < new Date()) {
      throw new Error('Code OTP expiré.');
    }
  
    // Marquer le code OTP comme utilisé
    await this.base('OTP').update(otpRecord.id, { used: 'true' });
  
    console.log(`Code OTP validé pour l'utilisateur ID : ${userId}`);
    return true;
  }

  // Méthode pour générer un code OTP et l'envoyer par e-mail.
  async validateOTP(userId: string, destinataireId: string, otpCode: string, montant: number): Promise<boolean> {
    // Récupérer le code OTP associé à l'utilisateur
    const otpRecords = await this.base('OTP')
      .select({
        filterByFormula: `AND({user_id} = '${userId}',{destinataire_id} = '${destinataireId}', {montant} = '${montant}', {code} = '${otpCode}', {used} = 'false')`,
      })
      .firstPage();
  
    if (otpRecords.length === 0) {
      //throw new Error('Code OTP invalide, déjà utilisé ou ne correspond pas à cette opération ou soit le montant est erroné ou le compte à débiter et/ou à créditer est erroné.');
      throw new Error('Code OTP invalide ou déjà utilisé ou montant incorrect.');

    }
  
    const otpRecord = otpRecords[0];
    const expiresAt = new Date(otpRecord.fields.expires_at);
  
    // Vérifier si le code OTP est expiré
    if (expiresAt < new Date()) {
      throw new Error('Code OTP expiré.');
    }
  
    // Marquer le code OTP comme utilisé
    await this.base('OTP').update(otpRecord.id, { used: 'true' });
  
    console.log(`Code OTP validé pour l'utilisateur ID : ${userId}`);
    return true;
  }

  // Méthode pour générer un code OTP
  async generateOTP(userId: string, destinataireId: string, montant: number): Promise<{ operationId: string, message: string }> {
    //const otpCode = crypto.randomBytes(3).toString('hex').toUpperCase(); // Exemple : "A1B2C3"
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const operationId = Math.floor(1000000000 + Math.random() * 9000000000).toString();

    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    // Stocker le code OTP dans la table OTP
    await this.base('OTP').create([
      {
        fields: {
          user_id: [userId],
          destinataire_id: destinataireId,
          montant: montant,
          code: otpCode,
          operation_id: operationId,
          expires_at: expiresAt.toISOString(),
        },
      },
    ]);

    // Envoyer le code OTP par e-mail
    const user = await this.getUserById(userId);
    const email = user.email;
    const userName = user.name;
    await this.mailService.sendOTPEmail(userName, email, otpCode, operationId);

    console.log(`Code OTP généré pour l'utilisateur ID : ${userId}, Opération ID : ${operationId}, Code : ${otpCode}`);
    return { message: 'Un code OTP a été envoyé à votre adresse e-mail. Veuillez le saisir pour valider l\'opération.', operationId};
    //return otpCode;
  }

  // Méthode pour générer un code OTP pour le paiement dans AGRICONNECT
  async generateAgripayOTP(userId: string, montant: number, orderId: string, farmers: Array<{ numCompte: string; montant: number }>, motif: string ): Promise<{ operationId: string, message: string }> {
    //const otpCode = crypto.randomBytes(3).toString('hex').toUpperCase(); // Exemple : "A1B2C3"
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const operationId = Math.floor(1000000000 + Math.random() * 9000000000).toString();

    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    // Stocker le code OTP dans la table OTP
    await this.base('OTP').create([
      {
        fields: {
          user_id: [userId],
          montant: montant,
          motif: motif,
          code: otpCode,
          operation_id: operationId,
          orderId: orderId,
          farmers: JSON.stringify(farmers), // Convertir les farmers en chaîne JSON
          expires_at: expiresAt.toISOString(),
        },
      },
    ]);

    // Envoyer le code OTP par e-mail
    const user = await this.getUserById(userId);
    const email = user.email;
        const userName = user.name;
    await this.mailService.sendOTPEmail(userName, email, otpCode, operationId);

    console.log(`Code OTP généré pour l'utilisateur ID : ${userId}, Opération ID : ${operationId}`);
    return { message: 'Un code OTP a été envoyé à votre adresse e-mail. Veuillez le saisir pour valider l\'opération.', operationId};
    //return otpCode;
  }
  // Méthode pour générer un code OTP
  async generateOTPInter(userId: string, destinataireId: string, montant: number, nom: string, prenoms: string, address: string, phone: string, destEmail: string): Promise<{ operationId: string, message: string }> {
    //const otpCode = crypto.randomBytes(3).toString('hex').toUpperCase(); // Exemple : "A1B2C3"
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const operationId = Math.floor(1000000000 + Math.random() * 9000000000).toString();

    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    // Stocker le code OTP dans la table OTP
    await this.base('OTP').create([
      {
        fields: {
          user_id: [userId],
          destinataire_id: destinataireId,
          montant: montant,
          code: otpCode,
          operation_id: operationId,
          expires_at: expiresAt.toISOString(),
        },
      },
    ]);

    // Envoyer le code OTP par e-mail
    const user = await this.getUserById(userId);
    const email = user.email;
        const userName = user.name;
    await this.mailService.sendOTPEmail(userName, email, otpCode, operationId);

    console.log(`Code OTP généré pour l'utilisateur ID : ${userId}, Opération ID : ${operationId}, Code : ${otpCode}`);
    return { message: 'Un code OTP a été envoyé à votre adresse e-mail. Veuillez le saisir pour valider l\'opération.', operationId};
    //return otpCode;
  }
  // Méthode pour vérifier si le code OTP associé à une opération a expiré
  async checkOTPExpiration(operationId: string): Promise<boolean> {
    try {
      console.log(`Vérification de l'expiration du code OTP pour l'opération ID : ${operationId}`);

      const otpRecords = await this.base('OTP')
        .select({ filterByFormula: `{operation_id} = '${operationId}'` })
        .firstPage();

      if (otpRecords.length === 0) {
        throw new Error("Aucun enregistrement OTP trouvé pour cet ID d'opération.");
      }

      const otpRecord = otpRecords[0];
      const codeExpired = otpRecord.fields.code_expired;
      const codeStatus = otpRecord.fields.used;

      if (codeStatus == 'true') {
        throw new Error("Le code OTP précédent a été déjà utilisé.");
      }

      if (codeExpired !== 'Yes') {
        throw new Error("Le code OTP précédent n'a pas encore expiré.");
      }

      console.log(`Le code OTP précédent a expiré pour l'opération ID : ${operationId}`);
      return true;
    } catch (error) {
      console.error(`Erreur lors de la vérification de l'expiration du code OTP : ${error.message}`);
      throw error;
    }
  }
  // Méthode pour générer un nouveau code OTP et mettre à jour l'enregistrement existant dans la table OTP
  async regenerateOTP(operationId: string): Promise<{ operationId: string }> {
    try {
      console.log(`Regénération du code OTP pour l'opération ID : ${operationId}`);

      // Vérifier que le code OTP précédent a expiré
      await this.checkOTPExpiration(operationId);

      // Générer un nouveau code OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 5 minutes

      // Récupérer l'enregistrement OTP existant
      const otpRecords = await this.base('OTP')
        .select({ filterByFormula: `{operation_id} = '${operationId}'` })
        .firstPage();

      if (otpRecords.length === 0) {
        throw new Error("Aucun enregistrement OTP trouvé pour cet ID d'opération.");
      }

      const otpRecord = otpRecords[0];

      // Mettre à jour l'enregistrement OTP avec le nouveau code et les nouvelles informations
      await this.base('OTP').update(otpRecord.id, {
        code: otpCode,
        expires_at: expiresAt.toISOString(),
        //code_expired: 'No', // Réinitialiser l'expiration
      });

      // Envoyer le nouveau code OTP par e-mail
      const userId = otpRecord.fields.user_id;
      const userRecord = await this.getUserById(userId);
      const email = userRecord.email;
      const userName = userRecord.name;
      await this.mailService.sendOTPEmail(userName, email, otpCode, operationId);

      console.log(`Nouveau code OTP généré pour l'opération ID : ${operationId}, Code : ${otpCode}`);
      return {operationId };
    } catch (error) {
      console.error(`Erreur lors de la régénération du code OTP : ${error.message}`);
      throw error;
    }
  }  

  //méthode pour exécuter l'opération Approvisionnement une fois que le code OTP est validé.
  async executerOperation(master_numero_compte: string, marchand_numero_compte: string, montant: number, motif: string) {
    try {
      console.log('Début de l\'exécution de l\'opération...');

      // Récupérer les enregistrements du Master et du Marchand
      const masterRecord = await this.getUserByNumeroCompte(master_numero_compte);
      const marchandRecord = await this.getUserByNumeroCompte(marchand_numero_compte);

      // Débiter le solde du Master
      console.log('Débit du solde du Master...');
      const newMasterSolde = (masterRecord.solde || 0) - montant;
      await this.updateSolde(masterRecord.id, newMasterSolde);

      // Créditer le solde du Marchand
      console.log('Crédit du solde du Marchand...');
      const newMarchandSolde = (marchandRecord.solde || 0) + montant;
      await this.updateSolde(marchandRecord.id, newMarchandSolde);

    // Envoi des e-mails
    const masterDeviseCode = masterRecord.devise_code?.[0] || 'XOF';
    const marchandDeviseCode = marchandRecord.devise_code?.[0] || 'XOF';
    await this.mailService.sendDebitedEmailDepot(
      masterRecord.email,
      masterRecord.name,
      marchandRecord.name,
      montant,
      masterDeviseCode,
      motif
    );
    await this.mailService.sendCreditedEmail(
      marchandRecord.email,
      marchandRecord.name,
      masterRecord.name,
      montant,
      marchandDeviseCode,
      motif
    );
      // Créer la transaction
      console.log('Création de la transaction...');
      const deviseCode = marchandRecord.devise_code?.[0] || 'XOF'; // Récupérer la devise du pays
      const description = `Opération d'approvisionnement Marchand. Master(${master_numero_compte}) => Marchand(${marchand_numero_compte}) de ${montant} ${deviseCode}`;
      const transaction = await this.transactionsService.createTransactionAppro({
        type_operation: 'APPROVISIONNEMENT',
        montant,
        expediteur_id: masterRecord.id,
        destinataire_id: marchandRecord.id,
        description,
        motif,
        status: 'SUCCESS',
      });
      // Récupérer l'ID de la transaction créée
      const transactionId = transaction.id;

      console.log('Opération exécutée avec succès.');
      return {transaction_id: transactionId, nouveau_solde_master: newMasterSolde, nouveau_solde_marchand: newMarchandSolde };
    } catch (error) {
      console.error('Erreur lors de l\'exécution de l\'opération :', error.message);
      throw error; //(`Erreur lors de l'exécution de l'opération : ${error.message}`);
    }
  }

  //méthode pour exécuter l'opération Depot une fois que le code OTP est validé.
  async executerOperationDepot(marchand_numero_compte: string, client_numero_compte: string, montant: number, motif: string) {
    try {
      console.log('Début de l\'exécution de l\'opération...');

      // Récupérer les enregistrements du Marchand et du Client
      const marchandRecord = await this.getUserByNumeroCompte(marchand_numero_compte);
      const clientRecord = await this.getUserByNumeroCompte(client_numero_compte);

      // Calculer les frais de dépot
      const type_operation = 'DEPOT';
      const compteSysteme = await this.compteSystemeService.getCompteSystemeByTypeOperation('RETRAIT');

      // Débiter le solde du Marchand
      console.log('Débit du solde du Marchand...');
      const newMarchandSolde = (marchandRecord.solde || 0) - montant;
      await this.updateSolde(marchandRecord.id, newMarchandSolde);

      // Créditer le solde du Client
      console.log('Crédit du solde du Client...');
      const newClientSolde = (clientRecord.solde || 0) + montant;
      await this.updateSolde(clientRecord.id, newClientSolde);

    // Envoi des e-mails
    const marchandDeviseCode = marchandRecord.devise_code?.[0] || 'XOF';
    const clientDeviseCode = clientRecord.devise_code?.[0] || 'XOF';

    await this.mailService.sendDebitedEmailDepot(
      marchandRecord.email,
      marchandRecord.name,
      clientRecord.name,
      montant,
      marchandDeviseCode,
      motif
    );
    await this.mailService.sendCreditedEmail(
      clientRecord.email,
      clientRecord.name,
      marchandRecord.name,
      montant,
      clientDeviseCode,
      motif
    );

      // Créer la transaction
      console.log('Création de la transaction...');
      const deviseCode = clientRecord.devise_code?.[0] || 'XOF'; // Récupérer la devise du pays 
      const description = `Opération d'approvisionnement Client. Marchand(${marchand_numero_compte}) => Client(${client_numero_compte}) de ${montant} ${deviseCode}`;
    const transaction = await this.transactionsService.createTransactionAppro({
        type_operation: 'DEPOT',
        montant,
        //date_transaction: new Date().toISOString(),
        expediteur_id: marchandRecord.id,
        destinataire_id: clientRecord.id,
        description,
        motif,
        status: 'SUCCESS',
      });

    // Partager les commissions
    await this.shareCommissionsDepot(type_operation, clientRecord.pays_id, montant, marchand_numero_compte, compteSysteme);
    // Récupérer l'ID de la transaction créée
    const transactionId = transaction.id;
    
      console.log('Opération exécutée avec succès.');
      return {transaction_id: transactionId, nouveau_solde_marchand: newMarchandSolde, nouveau_solde_client: newClientSolde };
    } catch (error) {
      console.error('Erreur lors de l\'exécution de l\'opération :', error.message);
      throw error;
    }
  }

//méthode pour exécuter l'opération Depot une fois que le code OTP est validé.
  async executerOperationDepotInter(marchand_numero_compte: string, client_numero_compte: string, montant: number, motif: string) {
    try {
      console.log('Début de l\'exécution de l\'opération...');

      // Récupérer les enregistrements du Marchand et du Client
      const marchandRecord = await this.getUserByNumeroCompte(marchand_numero_compte);
      const clientRecord = await this.getUserByNumeroCompte(client_numero_compte);

      // Calculer les frais de dépot
      //const type_operation = 'DEPOT_INTER';
      //const compteSysteme = await this.compteSystemeService.getCompteSystemeByTypeOperation('RETRAIT');
      
      const type_operation = 'DEPOT_INTER';
      const fraisTransfert = await this.grilleTarifaireService.getFraisOperation(marchandRecord.pays_id, type_operation, montant); // Récupérer les frais
      const montantTotal = montant + fraisTransfert;

      // Débiter le solde du Marchand
      console.log('Débit du solde du Marchand...');
      const newMarchandSolde = (marchandRecord.solde || 0) - montantTotal;
      await this.updateSolde(marchandRecord.id, newMarchandSolde);

      // Créditer le solde du Client
      console.log('Crédit du solde du Client...');
      const newClientSolde = (clientRecord.solde || 0) + montant;
      await this.updateSolde(clientRecord.id, newClientSolde);


    // Transférer les frais vers le compte de commissions
    const compteSysteme = await this.compteSystemeService.getCompteSystemeByTypeOperation('TRANSFERT');
  
    await this.compteSystemeService.crediterCompteSysteme(compteSysteme.id, fraisTransfert);

      // Créer la transaction
      console.log('Création de la transaction...');
      const deviseCode = clientRecord.devise_code?.[0] || 'XOF'; // Récupérer la devise du pays 
      const description = `Opération d'approvisionnement Client. Marchand(${marchand_numero_compte}) => Client(${client_numero_compte}) de ${montant} ${deviseCode}`;
      const transaction = await this.transactionsService.createTransactionAppro({
        type_operation: 'DEPOT_INTER',
        montant,
        //date_transaction: new Date().toISOString(),
        expediteur_id: marchandRecord.id,
        destinataire_id: clientRecord.id,
        description,
        motif,
        status: 'SUCCESS',
      });

    // Partager les commissions
    await this.shareCommissionsDepotInter(type_operation, marchandRecord.pays_id, fraisTransfert, marchand_numero_compte, compteSysteme);
    // Récupérer l'ID de la transaction créée
    const transactionId = transaction.id;
    
    // Envoi des e-mails
    const marchandDeviseCode = marchandRecord.devise_code?.[0] || 'XOF';
    const clientDeviseCode = clientRecord.devise_code?.[0] || 'XOF';

    await this.mailService.sendDebitedEmailDepotInter(
      marchandRecord.email,
      marchandRecord.name,
      clientRecord.nom_pays,
      clientRecord.name,
      montantTotal,
      montant,
      marchandDeviseCode,
      motif,
      fraisTransfert,
      transactionId
    );

    await this.mailService.sendCreditedEmailDepotInter(
      clientRecord.email,
      clientRecord.name,
      marchandRecord.nom_pays,
      marchandRecord.name,
      montant,
      clientDeviseCode,
      motif,
      fraisTransfert,
      transactionId
    );

      console.log('Opération exécutée avec succès.');
      return {transaction_id: transactionId, nouveau_solde_marchand: newMarchandSolde, nouveau_solde_client: newClientSolde };
    } catch (error) {
      console.error('Erreur lors de l\'exécution de l\'opération :', error.message);
      throw error;
    }
  }

 //méthode pour exécuter l'opération Transfert une fois que le code OTP est validé.
 async executerOperationTransfert(client1_numero_compte: string, client2_numero_compte: string, montant: number, motif: string) {
  try {
    console.log('Début de l\'exécution de l\'opération...');

    // Récupérer les enregistrements du Marchand et du Client
    const client1Record = await this.getUserByNumeroCompte(client1_numero_compte);
    const client2Record = await this.getUserByNumeroCompte(client2_numero_compte);

      // Calculer les frais de transfert
      //const pays_id = client1Record.pays_id?.[0]; // Récupérer l'ID du pays du Client 1
      const type_operation = 'TRANSFERT';
      const fraisTransfert = await this.grilleTarifaireService.getFraisOperation(client1Record.pays_id, type_operation, montant); // Récupérer les frais
      const montantTotal = montant + fraisTransfert;

    // Débiter le solde du Marchand
    console.log('Débit du solde du Marchand...');
    const newClient1Solde = (client1Record.solde || 0) - montantTotal;
    await this.updateSolde(client1Record.id, newClient1Solde);

    // Créditer le solde du Client
    console.log('Crédit du solde du Client...');
    const newClient2Solde = (client2Record.solde || 0) + montant;
    await this.updateSolde(client2Record.id, newClient2Solde);


    // Transférer les frais vers le compte de commissions
    const compteSysteme = await this.compteSystemeService.getCompteSystemeByTypeOperation('TRANSFERT');
    await this.compteSystemeService.crediterCompteSysteme(compteSysteme.id, fraisTransfert);
    
    // Créer la transaction
    console.log('Création de la transaction...');
    const deviseCode = client1Record.devise_code?.[0] || 'XOF'; // Récupérer la devise du pays 
    const description = `Opération de transfert c-to-c . Client(${client1_numero_compte}) => Client(${client2_numero_compte}) de ${montant} ${deviseCode}. Frais = ${fraisTransfert} ${deviseCode}`;
    const transaction = await this.transactionsService.createTransactionAppro({
      type_operation: 'TRANSFERT',
      montant,
      //date_transaction: new Date().toISOString(),
      expediteur_id: client1Record.id,
      destinataire_id: client2Record.id,
      description,
      motif,
      frais : fraisTransfert,
      status: 'SUCCESS',
    });
    // Récupérer l'ID de la transaction créée
    const transactionId = transaction.id;
  // Envoi des e-mails
  const marchandDeviseCode = client1Record.devise_code?.[0] || 'XOF';
  const clientDeviseCode = client2Record.devise_code?.[0] || 'XOF';
  //const montantOp;


  await this.mailService.sendDebitedEmail(
    client1Record.email,
    client1Record.name,
    client2Record.name,
    montantTotal,
    marchandDeviseCode,
    motif,
    montant,
    fraisTransfert,
    //transactionId
  );

  await this.mailService.sendCreditedEmail(
    client2Record.email,
    client2Record.name,
    client1Record.name,
    montant,
    clientDeviseCode,
    motif,
    //fraisTransfert,
    //transactionId
  );
    console.log('Opération exécutée avec succès.');
    return {transaction_id: transactionId, nouveau_solde_client1: newClient1Solde, nouveau_solde_client2: newClient2Solde };
  } catch (error) {
    console.error('Erreur lors de l\'exécution de l\'opération :', error.message);
    throw error; //(`Erreur lors de l'exécution de l'opération : ${error.message}`);
  }
}

 //méthode pour exécuter l'opération de Retrait une fois que le code OTP est validé.
 async executerOperationRetrait(client_numero_compte: string, marchand_numero_compte: string, montant: number, motif: string) {
  try {
    console.log('Début de l\'exécution de l\'opération...');

    // Récupérer les enregistrements du Marchand et du Client
    const clientRecord = await this.getUserByNumeroCompte(client_numero_compte);
    const marchandRecord = await this.getUserByNumeroCompte(marchand_numero_compte);

      // Calculer les frais de transfert
      const type_operation = 'RETRAIT';
      const fraisTransfert = await this.grilleTarifaireService.getFraisOperation(clientRecord.pays_id, type_operation, montant); // Récupérer les frais
      const montantTotal = montant + fraisTransfert;

    // Débiter le solde du Client
    console.log('Débit du solde du Client...');
    const newClientSolde = (clientRecord.solde || 0) - montantTotal;
    await this.updateSolde(clientRecord.id, newClientSolde);

    // Créditer le solde du Marchand
    console.log('Crédit du solde du Marchand...');
    const newMarchandSolde = (marchandRecord.solde || 0) + montant;
    await this.updateSolde(marchandRecord.id, newMarchandSolde);

    // Transférer les frais vers le compte de commissions
    const compteSysteme = await this.compteSystemeService.getCompteSystemeByTypeOperation('RETRAIT');
    await this.compteSystemeService.crediterCompteSysteme(compteSysteme.id, fraisTransfert);

  // Envoi des e-mails
  const marchandDeviseCode = marchandRecord.devise_code?.[0] || 'XOF';
  const clientDeviseCode = clientRecord.devise_code?.[0] || 'XOF';
  //const montantOp;


  await this.mailService.sendDebitedEmail(
    clientRecord.email,
    clientRecord.name,
    marchandRecord.name,
    montantTotal,
    clientDeviseCode,
    motif,
    montant,
    fraisTransfert
  );

  await this.mailService.sendCreditedEmail(
    marchandRecord.email,
    marchandRecord.name,
    clientRecord.name,
    montant,
    marchandDeviseCode,
    motif
  );

    // Créer la transaction
    console.log('Création de la transaction...');
    const deviseCode = clientRecord.devise_code?.[0] || 'XOF'; // Récupérer la devise du pays 
    const description = `Opération de retrait client . Client(${client_numero_compte}) => Marchand(${marchand_numero_compte}) de ${montant} ${deviseCode}. Frais = ${fraisTransfert} ${deviseCode} `;
    const transaction = await this.transactionsService.createTransactionAppro({
      type_operation: 'RETRAIT',
      montant,
      //date_transaction: new Date().toISOString(),
      expediteur_id: clientRecord.id,
      destinataire_id: marchandRecord.id,
      description,
      motif,
      frais : fraisTransfert,
      status: 'SUCCESS',
    });

    // Récupérer l'ID de la transaction créée
    const transactionId = transaction.id;
    
    // Partager les commissions
    await this.shareCommissions(type_operation, clientRecord.pays_id, fraisTransfert, marchand_numero_compte, compteSysteme);


    console.log('Opération exécutée avec succès.');
    return {transaction_id: transactionId, nouveau_solde_client: newClientSolde};
  } catch (error) {
    console.error('Erreur lors de l\'exécution de l\'opération :', error.message);
    throw error; //(`Erreur lors de l'exécution de l'opération : ${error.message}`);
  }
}

//méthode pour exécuter l'opération de compensatioin Marchand une fois que le code OTP est validé.
 async executerCompensationMarchand(marchand_numero_compte: string, master_numero_compte: string, montant: number, motif: string) {
  try {
    console.log('Début de l\'exécution de l\'opération...');

    // Récupérer les enregistrements du Marchand et du master
    const masterRecord = await this.getUserByNumeroCompte(master_numero_compte);
    const marchandRecord = await this.getUserByNumeroCompte(marchand_numero_compte);

    // Débiter le solde du master
    console.log('Débit du solde du Marchand...');
    const newMarchandSolde = (marchandRecord.solde || 0) - montant;
    await this.updateSolde(marchandRecord.id, newMarchandSolde);

    // Créditer le solde du Marchand
    console.log('Crédit du solde du Master...');
    const newMasterSolde = (masterRecord.solde || 0) + montant;
    await this.updateSolde(masterRecord.id, newMasterSolde);


  // Envoi des e-mails
  const marchandDeviseCode = marchandRecord.devise_code?.[0] || 'XOF';
  const masterDeviseCode = masterRecord.devise_code?.[0] || 'XOF';
  //const montantOp;



    // Créer la transaction
    console.log('Création de la transaction...');
    const deviseCode = masterRecord.devise_code?.[0] || 'XOF'; // Récupérer la devise du pays 
    const description = `Opération de compensation Marchand . Marchand(${marchand_numero_compte}) => Master(${master_numero_compte}) de ${montant} ${deviseCode}.`;
    const transaction = await this.transactionsService.createTransactionAppro({
      type_operation: 'COMPENSATION',
      montant,
      //date_transaction: new Date().toISOString(),
      expediteur_id: masterRecord.id,
      destinataire_id: marchandRecord.id,
      description,
      motif,
      //frais : fraisTransfert,
      status: 'SUCCESS',
    });

    const transactionId = transaction.id;

    const fraisTransfert = 0;
    await this.mailService.sendDebitCompensation(
      marchandRecord.email,
      marchandRecord.name,
      masterRecord.name,
      montant,
      marchandDeviseCode,
      motif,
      montant,
      fraisTransfert,
      transactionId
    );

    await this.mailService.sendCreditedEmail(
      marchandRecord.email,
      marchandRecord.name,
      masterRecord.name,
      montant,
      masterDeviseCode,
      motif
    );
    console.log('Opération exécutée avec succès.');
    return {transaction_id: transactionId, nouveau_solde_master: newMasterSolde, nouveau_solde_marchand: newMarchandSolde};
  } catch (error) {
    console.error('Erreur lors de l\'exécution de l\'opération :', error.message);
    throw error;
  }
}

//méthode pour exécuter l'opération de compensation Marchand une fois que le code OTP est validé.
 async executerCompensationCadre(cadre_numero_compte: string, admin_numero_compte: string, montant: number, motif: string) {
  try {
    console.log('Début de l\'exécution de l\'opération...');

    // Récupérer les enregistrements du Marchand et du master
    const adminRecord = await this.getUserByNumeroCompte(admin_numero_compte);
    const cadreRecord = await this.getUserByNumeroCompte(cadre_numero_compte);

    const fraisTransfert = montant * 0.075;

    const montantTotal = cadreRecord.type_utilisateur === "BUSINESS"
      ? fraisTransfert + montant
      : montant;

    const fraisTotal = cadreRecord.type_utilisateur === "BUSINESS"
      ? fraisTransfert
      : 0;

    // Débiter le solde du cadre
    console.log('Débit du solde du Marchand...');
    const newCadreSolde = (cadreRecord.solde || 0) - montantTotal;
    await this.updateSolde(cadreRecord.id, newCadreSolde);
  
   
    // Transférer les frais vers le compte de commissions
    if(cadreRecord.type_utilisateur === "BUSINESS"){
      const compteSysteme = await this.compteSystemeService.getCompteSystemeByTypeOperation('RETRAIT');
      await this.compteSystemeService.crediterCompteSysteme(compteSysteme.id, fraisTransfert);
    }

  const montantOp = cadreRecord.type_utilisateur === "BUSINESS" 
  ? (montantTotal - fraisTransfert) 
  : montant;
  // Envoi des e-mails
  const cadreDeviseCode = cadreRecord.devise_code?.[0] || 'XOF';

    // Créer la transaction
    console.log('Création de la transaction...');
    const deviseCode = cadreRecord.devise_code?.[0] || 'XOF'; 
    const description = `Compensation à partir du compte d'opérations en faveur de ${cadreRecord.name}(${cadre_numero_compte}) de ${montant} ${deviseCode}.`;
    const transaction = await this.transactionsService.createTransactionAppro({
      type_operation: 'COMPENSATION',
      montant,
      //expediteur_id: adminRecord.id,
      destinataire_id: cadreRecord.id,
      description,
      motif,
      frais : fraisTotal,
      status: 'SUCCESS',
    });

    const transactionId = transaction.id;

    await this.mailService.sendDebitCompensationCadre(
    cadreRecord.email,
    cadreRecord.name,
    adminRecord.name,
    montantTotal,
    cadreDeviseCode,
    motif,
    montantOp,
    fraisTotal,
    transactionId
  );

    console.log('Opération exécutée avec succès.');
    return {transaction_id: transactionId, nouveau_solde_acteur: newCadreSolde};
  } catch (error) {
    console.error('Erreur lors de l\'exécution de l\'opération :', error.message);
    throw error;
  }
}

async exchangeBalance(
  typeOperation: string,
  direction: 'SYSTEM_TO_ADMIN' | 'ADMIN_TO_SYSTEM',
  montant: number
): Promise<void> {
  try {
    console.log(`Échange de soldes entre un compte système et le compte ADMIN...`);

    // Récupérer le compte ADMIN
    const adminRecord = await this.getAdminAccount();

    // Récupérer le compte système correspondant au type d'opération
    const compteSysteme = await this.compteSystemeService.getCompteSystemeByTypeOperation(typeOperation);

    if (!['SYSTEM_TO_ADMIN', 'ADMIN_TO_SYSTEM'].includes(direction)) {
    throw new Error(`Direction invalide : ${direction}. Elle doit être 'SYSTEM_TO_ADMIN' ou 'ADMIN_TO_SYSTEM'.`);
    }

    // Valider que le solde du compte débiteur est suffisant
    if (direction === 'SYSTEM_TO_ADMIN') {
      if ((compteSysteme.fields.solde || 0) < montant) {
        throw new Error(`Solde insuffisant sur le compte système : ${typeOperation}`);
      }
    } else if (direction === 'ADMIN_TO_SYSTEM') {
      if ((adminRecord.fields.solde || 0) < montant) {
        throw new Error(`Solde insuffisant sur le compte ADMIN`);
      }
    }

    // Effectuer le transfert
    if (direction === 'SYSTEM_TO_ADMIN') {
      // Débiter le compte système
      //const nouveauSoldeCompteSysteme = (compteSysteme.fields.solde || 0) - montant;
      await this.compteSystemeService.debiterCompteSysteme(compteSysteme.id, montant);

      // Créditer le compte ADMIN
      const nouveauSoldeAdmin = (adminRecord.fields.solde || 0) + montant;
      await this.updateSolde(adminRecord.id, nouveauSoldeAdmin);
    } else if (direction === 'ADMIN_TO_SYSTEM') {
      // Débiter le compte ADMIN
      const nouveauSoldeAdmin = (adminRecord.fields.solde || 0) - montant;
      await this.updateSolde(adminRecord.id, nouveauSoldeAdmin);

      // Créditer le compte système
      //const nouveauSoldeCompteSysteme = (compteSysteme.fields.solde || 0) + montant;
      await this.compteSystemeService.crediterCompteSysteme(compteSysteme.id, montant);
    }
    console.log('Admin ID:', adminRecord.id, 'Type:', typeof adminRecord.id);
    console.log('Compte système ID:', compteSysteme.id, 'Type:', typeof compteSysteme.id);
    
    const adminDeviseCode = adminRecord.devise_code?.[0] || 'XOF';

    /*await this.mailService.sendDebitedEmailDepot(
      adminRecord.email,
      adminRecord.nom,
      compteSysteme.typeOperation,
      montant,
      adminDeviseCode,
      motif
    );
    await this.mailService.sendCreditedEmail(
      marchandRecord.email,
      marchandRecord.nom,
      clientRecord.nom,
      montant,
      marchandDeviseCode,
      motif
    );*/

    // Créer une transaction pour tracer l'échange
    const description =
      direction === 'SYSTEM_TO_ADMIN'
        ? `Transfert de ${montant} du compte système ${typeOperation} vers le compte ADMIN`
        : `Transfert de ${montant} du compte ADMIN vers le compte système ${typeOperation}`;

    const transaction = await this.transactionsService.createTransactionAppro({
      type_operation: 'EXCHANGE',
      montant,

      // Dans tous les cas, compteCommission prend compteSysteme.id
      compteCommission: [compteSysteme.id],
      // Le destinataire/expéditeur dépend de la direction
      ...(direction === 'SYSTEM_TO_ADMIN'
        ? { destinataire_id: adminRecord.id }
        : { expediteur_id: adminRecord.id }),
      description,
      status: 'SUCCESS',
    });
    // Récupérer l'ID de la transaction créée
    const transactionId = transaction.id;

    console.log(`Échange de soldes effectué avec succès. ID opération:${transactionId}`);
    return transactionId; 
  } catch (error) {
    console.error(`Erreur lors de l'échange de soldes : ${error.message}`);
    throw error;
  }
}

  //méthode pour effectuer un Paiement une fois que le code OTP est validé.
  async executerOperationPayment(marchand_numero_compte: string, client_numero_compte: string, montant: number, motif: string) {
    try {
      console.log('Début de l\'exécution de l\'opération...');

      // Récupérer les enregistrements du Marchand et du Client
      const marchandRecord = await this.getUserByNumeroCompte(marchand_numero_compte);
      const clientRecord = await this.getUserByNumeroCompte(client_numero_compte);

      // Calculer les frais de dépot
      //const type_operation = 'PAIEMENT';
      //const compteSysteme = await this.compteSystemeService.getCompteSystemeByTypeOperation('RETRAIT');

      // Débiter le solde du Marchand
      console.log('Débit du solde du Client ...');
      const newClientSolde = (clientRecord.solde || 0) - montant;
      await this.updateSolde(clientRecord.id, newClientSolde);

      // Créditer le solde du Client
      console.log('Crédit du solde du Marchand_Business...');
      const newMarchandSolde = (marchandRecord.solde || 0) + montant;
      await this.updateSolde(marchandRecord.id, newMarchandSolde);

    // Envoi des e-mails
    const marchandDeviseCode = marchandRecord.devise_code?.[0] || 'XOF';
    const clientDeviseCode = clientRecord.devise_code?.[0] || 'XOF';

    await this.mailService.sendDebitedEmailDepot(
      clientRecord.email,
      clientRecord.name,
      marchandRecord.name,
      montant,
      clientDeviseCode,
      motif
    );
    await this.mailService.sendCreditedEmail(
      marchandRecord.email,
      marchandRecord.name,
      clientRecord.name,
      montant,
      marchandDeviseCode,
      motif
    );

      // Créer la transaction
      console.log('Création de la transaction...');
      const deviseCode = clientRecord.devise_code?.[0] || 'XOF'; // Récupérer la devise du pays 
      const description = `Opération de paiement Marchand. Client(${client_numero_compte}) => Marchand_Business(${marchand_numero_compte}) de ${montant} ${deviseCode}`;
      //await this.transactionsService.createTransactionAppro({
       const transaction = await this.transactionsService.createTransactionAppro({
        type_operation: 'PAIEMENT',
        montant,
        //date_transaction: new Date().toISOString(),
        expediteur_id: clientRecord.id,
        destinataire_id: marchandRecord.id,
        description,
        motif,
        status: 'SUCCESS',
      });

    // Partager les commissions
    //await this.shareCommissionsDepot(type_operation, clientRecord.pays_id, montant, marchand_numero_compte, compteSysteme);

    // Récupérer l'ID de la transaction créée
    const transactionId = transaction.id;
    
      console.log('Opération exécutée avec succès.');
      return { transaction_id: transactionId, nouveau_solde_marchand: newMarchandSolde, nouveau_solde_client: newClientSolde };
    } catch (error) {
      console.error('Erreur lors de l\'exécution de l\'opération :', error.message);
      throw error; //(`Erreur lors de l'exécution de l'opération : ${error.message}`);
    }
  }
// src/users/users.service.ts
async debitBusinessAccount(businessNumeroCompte: string, amount: number, orderId: string, motif: string): Promise<void> {
  try {
    console.log(`Débit du compte EBUSINESS : ${businessNumeroCompte}, Montant : ${amount}`);

    const businessRecord = await this.getUserByNumeroCompte(businessNumeroCompte);
    const currentBalance = businessRecord.solde || 0;
    const newBalance = currentBalance - amount;

    await this.updateSolde(businessRecord.id, newBalance);
    console.log(`Compte EBUSINESS débité avec succès : Nouveau solde = ${newBalance}`);
    const marchandDeviseCode = businessRecord.devise_code?.[0] || 'XOF';

      await this.mailService.sendDebitedEmailAgripay(
      businessRecord.email,
      businessRecord.name,
      amount,
      marchandDeviseCode,
      motif,
      orderId
    );

  } catch (error) {
    console.error(`Erreur lors du débit du compte EBUSINESS : ${error.message}`);
    throw error;
  }
}
// src/users/users.service.ts
/*async creditClientAccounts(orderId: string, motif: string, clientAccounts: { numCompte: string; montant: number }[]): Promise<void> {
  try {
    console.log('Crédit des comptes CLIENT...');

    for (const client of clientAccounts) {
      const clientRecord = await this.getUserByNumeroCompte(client.numCompte);

      // Vérifier que le Client est de type "CLIENT"
       await this.validateUserType(clientRecord.id, 'CLIENT');
      console.log('Client trouvé :', clientRecord);

      const currentBalance = clientRecord.solde || 0;
      const newBalance = currentBalance + client.montant;

      await this.updateSolde(clientRecord.id, newBalance);
      console.log(`Compte CLIENT trouvé crédité : ${client.numCompte}, Nouveau solde = ${newBalance}`);

      const clientDeviseCode = clientRecord.devise_code?.[0] || 'XOF';
      await this.mailService.sendCreditedEmailAgripay(
      clientRecord.email,
      clientRecord.nom,
      client.montant,
      clientDeviseCode,
      motif,
      orderId
    );
    }
  } catch (error) {
    console.error(`Erreur lors du crédit des comptes CLIENT : ${error.message}`);
    throw error;
  }
}*/
async creditClientAccounts(orderId: string, motif: string, clientAccounts: { numCompte: string; montant: number }[]): Promise<void> {
  console.log('Crédit des comptes CLIENT...');

  for (const client of clientAccounts) {
    try {
      // Étape 1 : Récupération du client
      const clientRecord = await this.getUserByNumeroCompte(client.numCompte);
      if (!clientRecord) {
        console.error(`❌ Client introuvable : ${client.numCompte}`);
        continue; // Ne pas arrêter la boucle
      }

      // Étape 2 : Validation du type
      await this.validateUserType(clientRecord.id, 'CLIENT');

      // Étape 3 : Validation du montant
      if (typeof client.montant !== 'number' || client.montant <= 0) {
        console.error(`❌ Montant invalide pour ${client.numCompte} : ${client.montant}`);
        continue;
      }

      // Étape 4 : Calcul du nouveau solde
      const currentBalance = clientRecord.solde || 0;
      const newBalance = currentBalance + client.montant;
      await this.updateSolde(clientRecord.id, newBalance);

      // Étape 5 : Notification
      const devise = Array.isArray(clientRecord.devise_code)
        ? clientRecord.devise_code[0]
        : (clientRecord.devise_code || 'XOF');

      await this.mailService.sendCreditedEmailAgripay(
        clientRecord.email,
        clientRecord.name,
        client.montant,
        devise,
        motif,
        orderId
      );

      console.log(`✅ Crédité : ${client.numCompte} (+${client.montant} ${devise})`);
    } catch (err) {
      console.error(`❌ Erreur traitement client ${client.numCompte} : ${err.message}`);
      // continue; (implicite)
    }
  }

  console.log('✅ Traitement terminé pour tous les clients.');
}


  //méthode pour effectuer un Paiement une fois que le code OTP est validé.
  async executerOperationAgripay(marchand_numero_compte: string, client_numero_compte: string, montant: number, motif: string) {
    try {
      console.log('Début de l\'exécution de l\'opération...');

      // Récupérer les enregistrements du Marchand et du Client
      const marchandRecord = await this.getUserByNumeroCompte(marchand_numero_compte);
      const clientRecord = await this.getUserByNumeroCompte(client_numero_compte);

      // Calculer les frais de dépot
      //const type_operation = 'PAIEMENT';
      //const compteSysteme = await this.compteSystemeService.getCompteSystemeByTypeOperation('RETRAIT');

      // Débiter le solde du Marchand
      console.log('Débit du solde du Client ...');
      const newClientSolde = (clientRecord.solde || 0) - montant;
      await this.updateSolde(clientRecord.id, newClientSolde);

      // Créditer le solde du Client
      console.log('Crédit du solde du Marchand_Business...');
      const newMarchandSolde = (marchandRecord.solde || 0) + montant;
      await this.updateSolde(marchandRecord.id, newMarchandSolde);

    // Envoi des e-mails
    const marchandDeviseCode = marchandRecord.devise_code?.[0] || 'XOF';
    const clientDeviseCode = clientRecord.devise_code?.[0] || 'XOF';

    await this.mailService.sendDebitedEmailDepot(
      clientRecord.email,
      clientRecord.name,
      marchandRecord.name,
      montant,
      clientDeviseCode,
      motif
    );
    await this.mailService.sendCreditedEmail(
      marchandRecord.email,
      marchandRecord.name,
      clientRecord.name,
      montant,
      marchandDeviseCode,
      motif
    );

      // Créer la transaction
      console.log('Création de la transaction...');
      const deviseCode = clientRecord.devise_code?.[0] || 'XOF'; // Récupérer la devise du pays 
      const description = `Opération de paiement Marchand. Client(${client_numero_compte}) => Marchand_Business(${marchand_numero_compte}) de ${montant} ${deviseCode}`;
      //await this.transactionsService.createTransactionAppro({
       const transaction = await this.transactionsService.createTransactionAppro({
        type_operation: 'PAIEMENT',
        montant,
        //date_transaction: new Date().toISOString(),
        expediteur_id: clientRecord.id,
        destinataire_id: marchandRecord.id,
        description,
        motif,
        status: 'SUCCESS',
      });

    // Partager les commissions
    //await this.shareCommissionsDepot(type_operation, clientRecord.pays_id, montant, marchand_numero_compte, compteSysteme);

    // Récupérer l'ID de la transaction créée
    const transactionId = transaction.id;
    
      console.log('Opération exécutée avec succès.');
      return { transaction_id: transactionId, nouveau_solde_marchand: newMarchandSolde, nouveau_solde_client: newClientSolde };
    } catch (error) {
      console.error('Erreur lors de l\'exécution de l\'opération :', error.message);
      throw error; //(`Erreur lors de l'exécution de l'opération : ${error.message}`);
    }
  }
}
