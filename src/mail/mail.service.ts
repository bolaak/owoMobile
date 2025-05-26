// src/mail/mail.service.ts
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Config } from '../config';

@Injectable()
export class MailService {
  private transporter;

  constructor() {
    if (!Config.SMTP_HOST || !Config.SMTP_PORT || !Config.SMTP_USER || !Config.SMTP_PASSWORD) {
      throw new Error('Les variables d\'environnement SMTP ne sont pas correctement définies.');
    }

    this.transporter = nodemailer.createTransport({
      host: Config.SMTP_HOST,
      port: Config.SMTP_PORT,
      secure: Config.SMTP_PORT === 465, // true pour SSL, false pour TLS
      auth: {
        user: Config.SMTP_USER,
        pass: Config.SMTP_PASSWORD,
      },
      debug: true, // Active le mode debug
      tls: {
        rejectUnauthorized: false, // Désactive la validation du certificat SSL (si nécessaire)
      },
    });

    // Test de connexion SMTP
    this.transporter.verify((error) => {
      if (error) {
        console.error('Erreur de connexion SMTP :', error);
        throw new Error('Impossible de se connecter au serveur SMTP');
      }
      console.log('Connexion SMTP réussie');
    });
  }

  async sendMail(to: string, subject: string, text: string, html?: string) {
    const mailOptions = {
      from: `"OwoMobile" <${Config.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Email envoyé à ${to}`);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email :', error);
      throw new Error('Erreur lors de l\'envoi de l\'email');
    }
  }

  async sendTransactionEmail(to: string, subject: string, body: string): Promise<void> {
    const mailOptions = {
      from: `"owoPay" <${Config.SMTP_USER}>`,
      to,
      subject,
      text: body,
      //html,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Email envoyé à ${to}`);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email :', error);
      throw new Error('Erreur lors de l\'envoi de l\'email');
    }
  }

  async sendOTPEmail(email: string, otpCode: string, operationId: string): Promise<void> {
    // Utilisez une bibliothèque comme Nodemailer pour envoyer l'e-mail
    console.log(`Envoi du code OTP: ${otpCode} à l'adresse e-mail : ${email} `);

    const mailOptions = {
      //from: process.env.EMAIL_USER,
      from: `"OwoMobile" <${Config.SMTP_USER}>`,
      to: email,
      subject: 'Code OTP pour la validation de l\'opération ',
      text: `Votre code OTP est : ${otpCode} pour l\'opération : ${operationId}. Ce code est valide pendant 5 minutes.`,
    };

    //await transporter.sendMail(mailOptions);
    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Email envoyé à ${email}`);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email :', error);
      throw new Error('Erreur lors de l\'envoi de l\'email');
    }
  }

async sendDebitedEmail(debiteurEmail: string, debiteurNom: string, crediteurNom: string, montant: number, devise: string, motif: string, montantOp: number, frais: number): Promise<void> {
  const subject = 'Notification de débit de compte';
  const body = `
    Bonjour ${debiteurNom},

    Votre compte a été débité de ${montant} ${devise}.
    Détails de la transaction :
    - Motif : ${motif}
    - Destinataire : ${crediteurNom}
    - Montant de l'opération : ${montantOp} ${devise}
    - Frais : ${frais} ${devise}
    

    Merci d'avoir utilisé notre service.
  `;
  await this.sendTransactionEmail(debiteurEmail, subject, body);
}

async sendDebitedEmailDepot(debiteurEmail: string, debiteurNom: string, crediteurNom: string, montant: number, devise: string, motif: string): Promise<void> {
  const subject = 'Notification de débit de compte';
  const body = `
    Bonjour ${debiteurNom},

    Votre compte a été débité de ${montant} ${devise}.
    Détails de la transaction :
    - Motif : ${motif}
    - Destinataire : ${crediteurNom}
    

    Merci d'avoir utilisé notre service.
  `;
  await this.sendTransactionEmail(debiteurEmail, subject, body);
}
async sendDebitedEmailAgripay(debiteurEmail: string, debiteurNom: string, montant: number, devise: string, motif: string, orderId: string): Promise<void> {
  const subject = 'AGRICONNECT-AYMENT';
  const body = `
    Bonjour ${debiteurNom},

    Votre compte a été débité de ${montant} ${devise}.
    Détails de la transaction :
    - Motif : ${motif}
    - Commande : ${orderId}
    

    Merci d'avoir utilisé notre service.
  `;
  await this.sendTransactionEmail(debiteurEmail, subject, body);
}

async sendCreditedEmail(crediteurEmail: string, crediteurNom: string, debiteurNom: string, montant: number, devise: string, motif: string): Promise<void> {
  const subject = 'Notification de crédit de compte';
  const body = `
    Bonjour ${crediteurNom},

    Votre compte a été crédité de ${montant} ${devise}.
    Détails de la transaction :
    - Motif : ${motif}
    - Expéditeur : ${debiteurNom}


    Merci d'avoir utilisé notre service.
  `;
  await this.sendTransactionEmail(crediteurEmail, subject, body);
}
async sendCreditedEmailAgripay(crediteurEmail: string, crediteurNom: string, montant: number, devise: string, motif: string, orderId: string): Promise<void> {
  const subject = 'AGRICONNECT-PAYMENT';
  const body = `
    Bonjour ${crediteurNom},

    Votre compte a été crédité de ${montant} ${devise}.
    Détails de la transaction :
    - Motif : ${motif}
    - Commande : ${orderId}


    Merci d'avoir utilisé notre service.
  `;
  await this.sendTransactionEmail(crediteurEmail, subject, body);
}
}