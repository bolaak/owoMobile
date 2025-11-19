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
      html: body,
      //,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Email envoyé à ${to}`);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email :', error);
      throw new Error('Erreur lors de l\'envoi de l\'email');
    }
  }

async sendOTPEmail(userName: string, email: string, otpCode: string, operationId: string): Promise<void> {
  console.log(`Envoi du code OTP: ${otpCode} à l'adresse e-mail : ${email}`);

  const htmlContent = `
  <div style="font-family: Arial, sans-serif; background:#f4f4f7; padding:20px;">
    <div style="max-width:600px; margin:auto; background:white; border-radius:12px; padding:30px; box-shadow:0 5px 15px rgba(0,0,0,0.08);">

      <!-- HEADER -->
      <h2 style="text-align:center; color:#2d3748; margin-bottom:10px;">
        🔐 Code secret de validation
      </h2>

      <!-- MESSAGE -->
      <p style="font-size:16px; color:#2d3748;">
        Bonjour <strong>${userName}<strong/>👋,
      </p>

      <p style="font-size:15px; color:#4a5568; line-height:1.6;">
        Voici votre code <strong>OTP sécurisé</strong> pour confirmer l’opération :
      </p>

      <!-- OTP CODE BOX -->
      <div style="text-align:center; margin:25px 0;">
        <div style="
          display:inline-block;
          background:#edf2f7;
          padding:15px 30px;
          border-radius:10px;
          font-size:28px;
          letter-spacing:4px;
          font-weight:bold;
          color:#1a202c;
          border:2px dashed #cbd5e0;
        ">
          ${otpCode}
        </div>
      </div>

      <!-- DETAILS -->
      <p style="font-size:15px; color:#4a5568; line-height:1.6;">
        🧾 <strong>ID Opération :</strong> ${operationId}<br>
        ⏳ Ce code reste valide <strong>5 minutes</strong>.
      </p>

      <!-- FOOTER -->
      <p style="font-size:14px; color:#718096; margin-top:30px; text-align:center;">
        Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet e-mail.
      </p>

      <p style="margin-top: 20px; text-align:center; font-size:13px; color: #777;">
        © OWOO AFRIKA – Sécurité & Confiance 🔒
      </p>

    </div>
  </div>
  `;

  const mailOptions = {
    from: `"OWOO AFRIKA" <${Config.SMTP_USER}>`,
    to: email,
    subject: '🔐 Code OTP - OWOO',
    html: htmlContent,
  };

  try {
    await this.transporter.sendMail(mailOptions);
    console.log(`Email envoyé à ${email}`);
  } catch (error) {
    console.error('Erreur lors de l’envoi de l’email :', error);
    throw new Error('Erreur lors de l’envoi de l’email');
  }
}


async sendDebitedEmail(debiteurEmail: string, debiteurNom: string, crediteurNom: string, montant: number, devise: string, motif: string, montantOp: number, frais: number): Promise<void> {
  const subject = 'Débit de compte';
  const body = `
  <div style="font-family:'Segoe UI', Tahoma, sans-serif; background-color:#f9f9f9; padding:20px;">
    <div style="background:#fff; padding:30px; border-radius:8px; max-width:600px; margin:auto; box-shadow:0 4px 10px rgba(0,0,0,0.08);">    
      <h2>Bonjour ${debiteurNom || ''}</h2>
      <p>Votre compte a été débité de ${montant} ${devise}.</p>
      <p>Détails de la transaction :</p>
      <ul>
       <li> Destinataire : ${crediteurNom}</li>
       <li>- Montant de l'opération : ${montantOp} ${devise}</li>
       <li> Motif : ${motif}</li>
       <li> Frais : ${frais} ${devise}</li>
      </ul>

      <p style="margin-top: 20px; text-align:center; font-size:13px; color: #777;">
        © OWOO AFRIKA – Sécurité & Confiance 🔒
      </p>
    </div>

  </div>
  `;
  await this.sendTransactionEmail(debiteurEmail, subject, body);
}

async sendDebitCompensation(debiteurEmail: string, debiteurNom: string, crediteurNom: string, montant: number, devise: string, motif: string, montantOp: number, frais: number, transactionId: string): Promise<void> {
  const subject = 'Notification de débit de compte';
  const body = `
  <div style="font-family:'Segoe UI', Tahoma, sans-serif; background-color:#f9f9f9; padding:20px;">
    <div style="background:#fff; padding:30px; border-radius:8px; max-width:600px; margin:auto; box-shadow:0 4px 10px rgba(0,0,0,0.08);">    
      <h2>Bonjour ${debiteurNom || ''}</h2>
      <p>Votre compte a été débité de ${montant} ${devise}.</p>
      <p>Détails de la transaction :</p>
      <ul>
       <li> Destinataire : ${crediteurNom}</li>
       <li> Motif : ${motif}</li>
       <li> Frais : ${frais} ${devise}</li>
       <li> TxnID : ${transactionId}</li>
      </ul>
      <p style="margin-top: 20px; text-align:center; font-size:13px; color: #777;">
        © OWOO AFRIKA – Sécurité & Confiance 🔒
      </p>
    </div>

  </div>
  `;
  await this.sendTransactionEmail(debiteurEmail, subject, body);
}


async sendDebitCompensationCadre(
  debiteurEmail: string,
  debiteurNom: string,
  crediteurNom: string,
  montant: number,
  devise: string,
  motif: string,
  montantOp: number,
  frais: number,
  transactionId: string
): Promise<void> {

  const subject = '💳 Débit de votre compte – OWOO AFRIKA';

  const body = `
  <div style="font-family: Arial, sans-serif; background:#f4f4f7; padding:20px;">
    <div style="max-width:600px; margin:auto; background:white; border-radius:12px; padding:30px; box-shadow:0 5px 15px rgba(0,0,0,0.08);">

      <!-- HEADER -->
      <h2 style="text-align:center; color:#2d3748; margin-bottom:10px;">
        💳 Débit de compte confirmé
      </h2>

      <!-- Message principal -->
      <p style="font-size:16px; color:#2d3748;">
        Bonjour <strong>${debiteurNom || ''}<strong/> 👋,
      </p>

      <p style="font-size:15px; color:#4a5568; line-height:1.6;">
        Votre compte vient d’être débité de :  
        <strong style="font-size:17px; color:#1a202c;">${montant} ${devise}</strong>.
      </p>

      <p style="font-size:15px; color:#4a5568; line-height:1.6; margin-top:15px;">
        Voici les détails de cette opération :
      </p>

      <!-- Transaction card -->
      <div style="
        margin:20px 0; 
        padding:20px; 
        background:#edf2f7; 
        border-radius:10px; 
        border:1px solid #e2e8f0;
      ">
        <p style="margin:8px 0; font-size:15px; color:#2d3748;">
          💰 <strong>Montant de l'opération :</strong> ${montantOp} ${devise}
        </p>

        <p style="margin:8px 0; font-size:15px; color:#2d3748;">
          💸 <strong>Frais appliqués :</strong> ${frais} ${devise}
        </p>
        
        <p style="margin:8px 0; font-size:15px; color:#2d3748;">
          📝 <strong>Motif :</strong> ${motif}
        </p>

        <p style="margin:8px 0; font-size:15px; color:#2d3748;">
          🔗 <strong>ID Transaction :</strong> ${transactionId}
        </p>
      </div>

      <!-- Footer -->
      <p style="font-size:14px; color:#718096; text-align:center; margin-top:25px;">
        Si vous n'êtes pas à l'origine de cette opération, veuillez contacter le support immédiatement.
      </p>

      <p style="text-align:center; font-size:13px; color: #777; margin-top:10px;">
        © OWOO AFRIKA – Sécurité & Confiance 🔒
      </p>

    </div>
  </div>
  `;

  await this.sendTransactionEmail(debiteurEmail, subject, body);
}



async sendDebitedEmailDepot(debiteurEmail: string, debiteurNom: string, crediteurNom: string, montant: number, devise: string, motif: string): Promise<void> {
  const subject = 'Debit de compte';
  const body = `
  <div style="font-family:'Segoe UI', Tahoma, sans-serif; background-color:#f9f9f9; padding:20px;">
    <div style="background:#fff; padding:30px; border-radius:8px; max-width:600px; margin:auto; box-shadow:0 4px 10px rgba(0,0,0,0.08);">    
      <h2>Bonjour ${debiteurNom || ''}</h2>
      <p>Votre compte a été débité de ${montant} ${devise}.</p>
      <p>Détails de la transaction :</p>
      <ul>
       <li> Destinataire : ${crediteurNom}</li>
       <li> Motif : ${motif}</li>

      </ul>
      <p style="margin-top: 20px; text-align:center; font-size:13px; color: #777;">
        © OWOO AFRIKA – Sécurité & Confiance 🔒
      </p>
    </div>

  </div>
  `;

  await this.sendTransactionEmail(debiteurEmail, subject, body);
}

async sendDebitedEmailDepotInter(debiteurEmail: string, debiteurNom: string, pays: string, crediteurNom: string, montant: number, devise: string, motif: string, frais: number, transactionId: string): Promise<void> {
  const subject = 'OwooTrans';
  const body = `
  <div style="font-family:'Segoe UI', Tahoma, sans-serif; background-color:#f9f9f9; padding:20px;">
    <div style="background:#fff; padding:30px; border-radius:8px; max-width:600px; margin:auto; box-shadow:0 4px 10px rgba(0,0,0,0.08);">    
      <h2>Bonjour ${debiteurNom || ''}</h2>
      <p>Votre compte a été débité de ${montant} ${devise}.</p>
      <p>Détails de la transaction :</p>
      <ul>
       <li> Destinataire : ${crediteurNom}</li>
       <li> Pays : ${pays}</li>       
       <li> Motif : ${motif}</li>
       <li> Frais : ${frais} ${devise}</li>
       <li> TxnID : ${transactionId}</li>
      </ul>
      <p style="margin-top: 20px; text-align:center; font-size:13px; color: #777;">
        © OWOO AFRIKA – Sécurité & Confiance 🔒
      </p>
    </div>

  </div>
  `;

  await this.sendTransactionEmail(debiteurEmail, subject, body);
}

async sendCreditedEmailDepotInter(crediteurEmail: string, crediteurNom: string, pays: string, debiteurNom: string, montant: number, devise: string, motif: string, frais: number, transactionId: string): Promise<void> {
  const subject = 'OwooTrans';
  const body = `
    
  <div style="font-family:'Segoe UI', Tahoma, sans-serif; background-color:#f9f9f9; padding:20px;">
    <div style="background:#fff; padding:30px; border-radius:8px; max-width:600px; margin:auto; box-shadow:0 4px 10px rgba(0,0,0,0.08);">    
      <h2>Bonjour ${crediteurNom || ''}</h2>
      <p>Votre compte a été crédité de ${montant} ${devise}.</p>
      <p>Détails de la transaction :</p>
      <ul>
       <li> Expéditeur : ${debiteurNom}</li>
       <li> TxnID : ${pays}</li>
       <li> Motif : ${motif}</li>
       <li> TxnID : ${transactionId} ${devise}</li>
      </ul>
      <p style="margin-top: 20px; text-align:center; font-size:13px; color: #777;">
        © OWOO AFRIKA – Sécurité & Confiance 🔒
      </p>
    </div>

  </div>
  `;
  await this.sendTransactionEmail(crediteurEmail, subject, body);
}

async sendDebitedEmailAgripay(debiteurEmail: string, debiteurNom: string, montant: number, devise: string, motif: string, orderId: string): Promise<void> {
  const subject = 'AGRICONNECT-PAYMENT';
  const body = `
  <div style="font-family:'Segoe UI', Tahoma, sans-serif; background-color:#f9f9f9; padding:20px;">
    <div style="background:#fff; padding:30px; border-radius:8px; max-width:600px; margin:auto; box-shadow:0 4px 10px rgba(0,0,0,0.08);">    
      <h2>Bonjour ${debiteurNom || ''}</h2>
      <p>Votre compte a été débité de ${montant} ${devise}.</p>
      <p>Détails de la transaction :</p>
      <ul>
       <li> Commande : ${orderId}</li>
       <li> Motif : ${motif}</li>
      </ul>
      <p style="margin-top: 20px; text-align:center; font-size:13px; color: #777;">
        © OWOO AFRIKA – Sécurité & Confiance 🔒
      </p>
    </div>

  </div>

  `;
  await this.sendTransactionEmail(debiteurEmail, subject, body);
}

async sendCreditedEmail(crediteurEmail: string, crediteurNom: string, debiteurNom: string, montant: number, devise: string, motif: string): Promise<void> {
  const subject = 'Compte créditeur';
  const body = `
    
  <div style="font-family:'Segoe UI', Tahoma, sans-serif; background-color:#f9f9f9; padding:20px;">
    <div style="background:#fff; padding:30px; border-radius:8px; max-width:600px; margin:auto; box-shadow:0 4px 10px rgba(0,0,0,0.08);">    
      <h2>Bonjour ${crediteurNom || ''}</h2>
      <p>Votre compte a été crédité de ${montant} ${devise}.</p>
      <p>Détails de la transaction :</p>
      <ul>
       <li> Expéditeur : ${debiteurNom}</li>
       <li> Motif : ${motif}</li>
      </ul>
      <p style="margin-top: 20px; text-align:center; font-size:13px; color: #777;">
        © OWOO AFRIKA – Sécurité & Confiance 🔒
      </p>
    </div>

  </div>
  `;
  await this.sendTransactionEmail(crediteurEmail, subject, body);
}
async sendCreditedEmailAgripay(crediteurEmail: string, crediteurNom: string, montant: number, devise: string, motif: string, orderId: string): Promise<void> {
  const subject = 'AGRICONNECT-PAYMENT';
  const body = `
  <div style="font-family:'Segoe UI', Tahoma, sans-serif; background-color:#f9f9f9; padding:20px;">
    <div style="background:#fff; padding:30px; border-radius:8px; max-width:600px; margin:auto; box-shadow:0 4px 10px rgba(0,0,0,0.08);">    
      <h2>Bonjour ${crediteurNom || ''}</h2>
      <p>Votre compte a été crédité de ${montant} ${devise}.</p>
      <p>Détails de la transaction :</p>
      <ul>
       <li> Commande : ${orderId}</li>
       <li> Motif : ${motif}</li>

      </ul>
      <p style="margin-top: 20px; text-align:center; font-size:13px; color: #777;">
        © OWOO AFRIKA – Sécurité & Confiance 🔒
      </p>
    </div>

  </div>
  `;
  await this.sendTransactionEmail(crediteurEmail, subject, body);
}
}