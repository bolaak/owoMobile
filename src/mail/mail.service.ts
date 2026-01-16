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
      from: `"OWOO AFRIKA" <${Config.SMTP_USER}>`,
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

/*async registerMail(email: string , nom: string, prenom: string, numero_compte :string , PIN :string , mot_de_passe :string, typeUser :string , code_marchand :string | null) {
    
  const textContent = `
  Félicitations ${nom} ${prenom} ! Votre portefeuille électronique est prêt.

  Voici vos informations de connexion :
  - Numéro : ${numero_compte}
  
  ⚠️ Merci de conserver ces informations en lieu sûr.
  Le code PIN vous sera demandé pour valider toute opération sensible.

  Si vous n'êtes pas à l'origine de cette création de compte, 
  contactez immédiatement notre support.

  © OWOO AFRIKA – Sécurité & Confiance 🔒
  `;

    const htmlContent = `
    <div style="font-family: Arial, sans-serif; background:#f4f4f7; padding:20px;">
      <div style="max-width:600px; margin:auto; background:white; border-radius:12px; padding:30px; box-shadow:0 5px 15px rgba(0,0,0,0.08);">

        <h2 style="text-align:center; color:#2d3748; margin-bottom:10px;">
          Félicitations ${nom} ${prenom}! Votre portefeuille électronique est prêt
        </h2>

        <p style="font-size:15px; color:#4a5568; line-height:1.6;"> 
          Voici vos informations de connexion :
        </p>

        <div style="background:#f7fafc; padding:20px; border-radius:10px; margin:20px 0; border:1px solid #e2e8f0;">
          <p style="margin:0; font-size:15px; color:#2d3748; line-height:1.8;">
            🔢 <strong>Numéro :</strong> ${numero_compte}<br>
            🔐 <strong>Code PIN :</strong> ${PIN}<br>
            🔑 <strong>Mot de passe :</strong> ${mot_de_passe}<br>
            ${
              typeUser === 'MASTER' || typeUser === 'BUSINESS'
                ? `💼 <strong>Code marchand :</strong> ${code_marchand}<br>`
                : ''
            }
          </p>
        </div>

        <p style="font-size:15px; color:#4a5568; line-height:1.6;">
          ⚠️ Merci de conserver ces informations en lieu sûr.<br>
             Le code PIN vous sera demandé pour valider toute opération sensible.
        </p>

        <p style="font-size:14px; color:#718096; margin-top:30px; text-align:center;">
          Si vous n'êtes pas à l'origine de cette création de compte, contactez immédiatement notre support.
        </p>

        <p style="text-align:center; font-size:13px; color: #777; margin-top:10px;">
          © OWOO AFRIKA – Sécurité & Confiance 🔒
        </p>          

      </div>
    </div>
    `;

    const mailOptions = {
      from: `"OWOO AFRIKA" <${Config.SMTP_USER}>`,
      to: email,
      subject: 'Ouverture de compte -  OWOO AFRIKA',
      text: textContent,
      html: htmlContent,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Email envoyé à ${email}`);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email :', error);
      throw new Error('Erreur lors de l\'envoi de l\'email');
    }
  }*/
    async registerMail(email: string , nom: string, prenom: string, numero_compte :string , PIN :string , mot_de_passe :string, typeUser :string , code_marchand :string | null) {
      const htmlContent = `
      <div style="font-family: Arial, sans-serif; background:#f4f4f7; padding:20px;">
        <div style="max-width:600px; margin:auto; background:white; border-radius:12px; padding:30px; box-shadow:0 5px 15px rgba(0,0,0,0.08);">
  
          <h2 style="text-align:center; color:#2d3748; margin-bottom:10px;">
            🎉 Félicitations 👤 ${nom} ${prenom}! Votre portefeuille électronique est prêt 💰✅
          </h2>
  
          <p style="font-size:15px; color:#4a5568; line-height:1.6;"> 
            Voici vos informations de connexion :
          </p>
  
          <div style="background:#f7fafc; padding:20px; border-radius:10px; margin:20px 0; border:1px solid #e2e8f0;">
            <p style="margin:0; font-size:15px; color:#2d3748; line-height:1.8;">
              🔢 <strong>Numéro de compte :</strong> ${numero_compte}<br>
              🔐 <strong>Code PIN :</strong> ${PIN}<br>
              🔑 <strong>Mot de passe :</strong> ${mot_de_passe}<br>
              ${
                typeUser === 'MASTER' || typeUser === 'BUSINESS'
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
            © OWOO AFRIKA – Sécurité & Confiance 🔒
          </p>          
  
        </div>
      </div>
      `;
  
      const mailOptions = {
        from: `"OWOO AFRIKA" <${Config.SMTP_USER}>`,
        to: email,
        subject: '📲 Ouverture de compte -  OWOO AFRIKA',
        html: htmlContent,
      };
  
      try {
        await this.transporter.sendMail(mailOptions);
        console.log(`Email envoyé à ${email}`);
      } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'email :', error);
        throw new Error('Erreur lors de l\'envoi de l\'email');
      }
    }
  async sendTransactionEmail(to: string, subject: string, body: string): Promise<void> {
    const mailOptions = {
      from: `"OwooPay" <${Config.SMTP_USER}>`,
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

  async sendPINMail(email: string, name: string, numero: string, PIN: string) {
    const htmlContent = `
  <div style="font-family: Arial, sans-serif; background:#f4f4f7; padding:20px;">
  <div style="max-width:600px; margin:auto; background:white; border-radius:12px; padding:30px; box-shadow:0 5px 15px rgba(0,0,0,0.08);">

    <!-- HEADER -->
    <h2 style="text-align:center; color:#2d3748; margin-bottom:10px;">
      🔐 Mise à jour de votre code PIN
    </h2>

    <!-- MESSAGE -->
    <p style="font-size:16px; color:#2d3748;">
      Bonjour <strong>${name}</strong>👋,
    </p>

    <p style="font-size:15px; color:#4a5568; line-height:1.6;">
      Votre <strong>nouveau code PIN</strong> a été généré avec succès. Veuillez le conserver dans un endroit sûr :
    </p>

    <!-- PIN BOX -->
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
        ${PIN}
      </div>
    </div>

    <!-- DETAILS -->
    <p style="font-size:15px; color:#4a5568; line-height:1.6;">
      🔒 Ce code est indispensable pour valider vos opérations sensibles.<br>
      ⚠️ Par sécurité, ne le partagez avec personne.
    </p>

    <!-- FOOTER -->
    <p style="font-size:14px; color:#718096; margin-top:30px; text-align:center;">
      Si vous n'êtes pas à l'origine de cette demande, modifiez immédiatement votre PIN ou contacter le support.
    </p>

    <p style="text-align:center; font-size:13px; color: #777;">
      © OWOO AFRIKA – Sécurité & Confiance
    </p>

  </div>
</div>

  `;
    const mailOptions = {
      from: `"OWOO AFRIKA" <${Config.SMTP_USER}>`,
      to: email,
      subject: '🔐 Code PIN - OWOO',
      html: htmlContent,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Email envoyé à ${email}`);
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

async sendDebitedEmail(
  debiteurEmail: string,
  debiteurNom: string,
  crediteurNom: string,
  montant: number,
  devise: string,
  motif: string,
  montantOp: number,
  frais: number
): Promise<void> {
  const subject = 'OWOO AFRIKA – Débit de compte';
  
  const body = `
  <div style="font-family:'Segoe UI', Tahoma, sans-serif; background-color:#f3f4f6; padding:20px;">
    <div style="background:#ffffff; padding:30px; border-radius:10px; max-width:650px; margin:auto; box-shadow:0 4px 12px rgba(0,0,0,0.1);">

      <h2 style="color:#111827; font-size:22px; margin-bottom:10px;">
        Bonjour ${debiteurNom || ''} 👋
      </h2>

      <p style="color:#374151; font-size:15px;">
        Votre compte a été <strong>débité</strong> de 
        <strong>${montant} ${devise}</strong>.
      </p>

      <h3 style="margin-top:25px; font-size:18px; color:#111827;">
        📄 Détails de la transaction :
      </h3>

      <ul style="font-size:15px; color:#374151; line-height:1.7; padding-left:15px;">
        <li><strong>Destinataire :</strong> ${crediteurNom}</li>
        <li><strong>Montant de l'opération :</strong> ${montantOp} ${devise}</li>
        <li><strong>Motif :</strong> ${motif}</li>
        <li><strong>Frais :</strong> ${frais} ${devise}</li>
      </ul>

      <p style="text-align:center; font-size:13px; color: #777; margin-top:10px;">
        © OWOO AFRIKA – Sécurité & Confiance 🔒
      </p>

    </div>
  </div>
  `;

  await this.sendTransactionEmail(debiteurEmail, subject, body);
}

/*async sendCreditedEmail(crediteurEmail: string, crediteurNom: string, debiteurNom: string, montant: number, devise: string, motif: string): Promise<void> {
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
}*/
async sendCreditedEmail(
  crediteurEmail: string,
  crediteurNom: string,
  debiteurNom: string,
  montant: number,
  devise: string,
  motif: string
): Promise<void> {

  const subject = 'OWOO AFRIKA – Compte crédité';

  const body = `
  <div style="font-family:'Segoe UI', Tahoma, sans-serif; background-color:#f3f4f6; padding:20px;">
    <div style="background:#ffffff; padding:30px; border-radius:10px; max-width:650px; margin:auto; box-shadow:0 4px 12px rgba(0,0,0,0.1);">

      <h2 style="color:#111827; font-size:22px; margin-bottom:10px;">
        Bonjour ${crediteurNom || ''} 🎉
      </h2>

      <p style="color:#374151; font-size:15px;">
        Votre compte a été <strong>crédité</strong> de 
        <strong>${montant} ${devise}</strong>. 💰
      </p>

      <h3 style="margin-top:25px; font-size:18px; color:#111827;">
        📄 Détails de la transaction :
      </h3>

      <ul style="font-size:15px; color:#374151; line-height:1.7; padding-left:15px;">
        <li><strong>Expéditeur :</strong> ${debiteurNom}</li>
        <li><strong>Motif :</strong> ${motif}</li>
      </ul>

      <p style="text-align:center; font-size:13px; color: #777; margin-top:10px;">
        © OWOO AFRIKA – Sécurité & Confiance 🔒
      </p>

    </div>
  </div>
  `;

  await this.sendTransactionEmail(crediteurEmail, subject, body);
}

/*async sendDebitCompensation(debiteurEmail: string, debiteurNom: string, crediteurNom: string, montant: number, devise: string, motif: string, montantOp: number, frais: number, transactionId: string): Promise<void> {
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
}*/
async sendDebitCompensation(
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

  const subject = '💳 Débit de compte – OWOO AFRIKA';

  const body = `
  <div style="font-family: Arial, sans-serif; background:#f4f4f7; padding:20px;">
    <div style="max-width:600px; margin:auto; background:white; border-radius:12px; padding:30px; box-shadow:0 5px 15px rgba(0,0,0,0.08);">

      <!-- HEADER -->
      <h2 style="text-align:center; color:#2d3748; margin-bottom:10px;">
        💳 Débit de votre compte
      </h2>

      <!-- Message principal -->
      <p style="font-size:16px; color:#2d3748;">
        Bonjour <strong>${debiteurNom || ''}</strong> 👋,
      </p>

      <p style="font-size:15px; color:#4a5568; line-height:1.6;">
        Votre compte a été débité de :  
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
          👤 <strong>Destinataire :</strong> ${crediteurNom}
        </p>

        <p style="margin:8px 0; font-size:15px; color:#2d3748;">
          📝 <strong>Motif :</strong> ${motif}
        </p>

        <p style="margin:8px 0; font-size:15px; color:#2d3748;">
          💸 <strong>Frais :</strong> ${frais} ${devise}
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



/*async sendDebitedEmailDepot(debiteurEmail: string, debiteurNom: string, crediteurNom: string, montant: number, devise: string, motif: string): Promise<void> {
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
}*/
async sendDebitedEmailDepot(
  debiteurEmail: string,
  debiteurNom: string,
  crediteurNom: string,
  montant: number,
  devise: string,
  motif: string
): Promise<void> {

  const subject = '💳 Débit de compte – OWOO AFRIKA';

  const body = `
  <div style="font-family: Arial, sans-serif; background:#f4f4f7; padding:20px;">
    <div style="max-width:600px; margin:auto; background:white; border-radius:12px; padding:30px; box-shadow:0 5px 15px rgba(0,0,0,0.08);">

      <!-- HEADER -->
      <h2 style="text-align:center; color:#2d3748; margin-bottom:10px;">
        💳 Débit de votre compte
      </h2>

      <!-- Message principal -->
      <p style="font-size:16px; color:#2d3748;">
        Bonjour <strong>${debiteurNom || ''}</strong> 👋,
      </p>

      <p style="font-size:15px; color:#4a5568; line-height:1.6;">
        Votre compte a été débité de :  
        <strong style="font-size:17px; color:#1a202c;">${montant} ${devise}</strong>.
      </p>

      <p style="font-size:15px; color:#4a5568; line-height:1.6; margin-top:15px;">
        Voici les détails de l’opération :
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
          👤 <strong>Destinataire :</strong> ${crediteurNom}
        </p>

        <p style="margin:8px 0; font-size:15px; color:#2d3748;">
          📝 <strong>Motif :</strong> ${motif}
        </p>
      </div>

      <!-- Footer -->
      <p style="font-size:14px; color:#718096; text-align:center; margin-top:25px;">
        Si vous n'êtes pas à l'origine de cette opération, contactez immédiatement notre support.
      </p>

      <p style="text-align:center; font-size:13px; color: #777; margin-top:10px;">
        © OWOO AFRIKA – Sécurité & Confiance 🔒
      </p>

    </div>
  </div>
  `;

  await this.sendTransactionEmail(debiteurEmail, subject, body);
}


/*async sendDebitedEmailDepotInter(debiteurEmail: string, debiteurNom: string, pays: string, crediteurNom: string, montant: number, devise: string, motif: string, frais: number, transactionId: string): Promise<void> {
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
}*/
async sendDebitedEmailDepotInter(
  debiteurEmail: string,
  debiteurNom: string,
  pays: string,
  crediteurNom: string,
  montantOp: number,
  montant: number,
  devise: string,
  motif: string,
  frais: number,
  transactionId: string
): Promise<void> {

  const subject = '💳 Débit international – OWOO AFRIKA';

  const body = `
  <div style="font-family: Arial, sans-serif; background:#f4f4f7; padding:20px;">
    <div style="max-width:600px; margin:auto; background:white; border-radius:12px; padding:30px; box-shadow:0 5px 15px rgba(0,0,0,0.08);">

      <!-- HEADER -->
      <h2 style="text-align:center; color:#2d3748; margin-bottom:10px;">
        🌍 OWOO AFRIKA – Transfert International
      </h2>

      <!-- Message principal -->
      <p style="font-size:16px; color:#2d3748;">
        Bonjour <strong>${debiteurNom || ''}</strong> 👋,
      </p>

      <p style="font-size:15px; color:#4a5568; line-height:1.6;">
        Votre compte a été débité de :
        <strong style="font-size:17px; color:#1a202c;">${montantOp} ${devise}</strong>.
      </p>

      <p style="font-size:15px; color:#4a5568; line-height:1.6; margin-top:15px;">
        Voici les détails de l’opération internationale :
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
          👤 <strong>Destinataire :</strong> ${crediteurNom}
        </p>

        <p style="margin:8px 0; font-size:15px; color:#2d3748;">
          🌍 <strong>Pays :</strong> ${pays}
        </p>

        <p style="margin:8px 0; font-size:15px; color:#2d3748;">
          💰 <strong>Montant de l'opération :</strong> ${montant} ${devise}
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
        Si vous n'êtes pas à l'origine de cette opération, contactez immédiatement le support OWOO AFRIKA.
      </p>

      <p style="text-align:center; font-size:13px; color: #777; margin-top:10px;">
        © OWOO AFRIKA – Sécurité & Confiance 🔒
      </p>

    </div>
  </div>
  `;

  await this.sendTransactionEmail(debiteurEmail, subject, body);
}

/*async sendCreditedEmailDepotInter(crediteurEmail: string, crediteurNom: string, pays: string, debiteurNom: string, montant: number, devise: string, motif: string, frais: number, transactionId: string): Promise<void> {
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
}*/

async sendCreditedEmailDepotInter(
  crediteurEmail: string,
  crediteurNom: string,
  pays: string,
  debiteurNom: string,
  montant: number,
  devise: string,
  motif: string,
  frais: number,
  transactionId: string
): Promise<void> {

  const subject = '💰 Transfert international – OWOO AFRIKA';

  const body = `
  <div style="font-family: Arial, sans-serif; background:#f4f4f7; padding:20px;">
    <div style="max-width:600px; margin:auto; background:white; border-radius:12px; padding:30px; box-shadow:0 5px 15px rgba(0,0,0,0.08);">

      <!-- HEADER -->
      <h2 style="text-align:center; color:#2d3748; margin-bottom:10px;">
        💰 Crédit de votre compte
      </h2>

      <!-- Message principal -->
      <p style="font-size:16px; color:#2d3748;">
        Bonjour <strong>${crediteurNom || ''}</strong> 👋,
      </p>

      <p style="font-size:15px; color:#4a5568; line-height:1.6;">
        Vous avez reçu un transfert de :
        <strong style="font-size:17px; color:#1a202c;">${montant} ${devise}</strong>.
      </p>

      <p style="font-size:15px; color:#4a5568; line-height:1.6; margin-top:15px;">
        Voici les détails de cette opération internationale :
      </p>

      <!-- Détails transaction -->
      <div style="
        margin:20px 0;
        padding:20px;
        background:#edf2f7;
        border-radius:10px;
        border:1px solid #e2e8f0;
      ">

        <p style="margin:8px 0; font-size:15px; color:#2d3748;">
          📤 <strong>Envoyé par :</strong> ${debiteurNom}
        </p>

        <p style="margin:8px 0; font-size:15px; color:#2d3748;">
          🌍 <strong>Pays d’origine :</strong> ${pays}
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
        Si vous n'êtes pas à l'origine de cette opération, contactez immédiatement le support OWOO AFRIKA.
      </p>

      <p style="text-align:center; font-size:13px; color: #777; margin-top:10px;">
        © OWOO AFRIKA – Sécurité & Confiance 🔒
      </p>

    </div>
  </div>
  `;

  await this.sendTransactionEmail(crediteurEmail, subject, body);
}


/*async sendDebitedEmailAgripay(debiteurEmail: string, debiteurNom: string, montant: number, devise: string, motif: string, orderId: string): Promise<void> {
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
}*/

async sendDebitedEmailAgripay(
  debiteurEmail: string,
  debiteurNom: string,
  montant: number,
  devise: string,
  motif: string,
  orderId: string
): Promise<void> {
  const subject = 'AGRICONNECT – Paiement Débité';
  const body = `
  <div style="font-family:'Segoe UI', Tahoma, sans-serif; background-color:#f3f4f6; padding:20px;">
    <div style="background:#ffffff; padding:30px; border-radius:10px; max-width:650px; margin:auto; box-shadow:0 4px 12px rgba(0,0,0,0.1);">

      <h2 style="color:#111827; font-size:22px; margin-bottom:10px;">
        Bonjour <strong>${debiteurNom || ''}<strong>,
      </h2>

      <p style="color:#374151; font-size:15px;">
        Votre compte a été <strong>débité</strong> de 
        <strong>${montant} ${devise}</strong>.
      </p>

      <h3 style="margin-top:25px; font-size:18px; color:#111827;">Détails de la transaction :</h3>
      <ul style="font-size:15px; color:#374151; line-height:1.7;">
        <li><strong>Commande :</strong> ${orderId}</li>
        <li><strong>Motif :</strong> ${motif}</li>
      </ul>

      <p style="text-align:center; font-size:13px; color: #777; margin-top:10px;">
        © OWOO AFRIKA – Sécurité & Confiance 🔒
      </p>

    </div>
  </div>
  `;

  await this.sendTransactionEmail(debiteurEmail, subject, body);
}

/*async sendCreditedEmailAgripay(crediteurEmail: string, crediteurNom: string, montant: number, devise: string, motif: string, orderId: string): Promise<void> {
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
}*/
async sendCreditedEmailAgripay(
  crediteurEmail: string,
  crediteurNom: string,
  montant: number,
  devise: string,
  motif: string,
  orderId: string
): Promise<void> {
  const subject = 'AGRICONNECT – Paiement effectué';
  const body = `
  <div style="font-family:'Segoe UI', Tahoma, sans-serif; background-color:#f3f4f6; padding:20px;">
    <div style="background:#ffffff; padding:30px; border-radius:10px; max-width:650px; margin:auto; box-shadow:0 4px 12px rgba(0,0,0,0.1);">

      <h2 style="color:#111827; font-size:22px; margin-bottom:10px;">
        Bonjour <strong>${crediteurNom || ''}</strong>,
      </h2>

      <p style="color:#374151; font-size:15px;">
        Votre compte a été <strong>crédité</strong> de 
        <strong>${montant} ${devise}</strong>.
      </p>

      <h3 style="margin-top:25px; font-size:18px; color:#111827;">Détails de la transaction :</h3>
      <ul style="font-size:15px; color:#374151; line-height:1.7;">
        <li><strong>Commande :</strong> ${orderId}</li>
        <li><strong>Motif :</strong> ${motif}</li>
      </ul>

      <p style="margin-top:25px; text-align:center; font-size:13px; color:#6b7280;">
        © OWOO AFRIKA – Sécurité & Confiance 🔒
      </p>

    </div>
  </div>
  `;

  await this.sendTransactionEmail(crediteurEmail, subject, body);
}

}