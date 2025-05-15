"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const nodemailer = require("nodemailer");
const config_1 = require("../config");
let MailService = class MailService {
    transporter;
    constructor() {
        if (!config_1.Config.SMTP_HOST || !config_1.Config.SMTP_PORT || !config_1.Config.SMTP_USER || !config_1.Config.SMTP_PASSWORD) {
            throw new Error('Les variables d\'environnement SMTP ne sont pas correctement définies.');
        }
        this.transporter = nodemailer.createTransport({
            host: config_1.Config.SMTP_HOST,
            port: config_1.Config.SMTP_PORT,
            secure: config_1.Config.SMTP_PORT === 465,
            auth: {
                user: config_1.Config.SMTP_USER,
                pass: config_1.Config.SMTP_PASSWORD,
            },
            debug: true,
            tls: {
                rejectUnauthorized: false,
            },
        });
        this.transporter.verify((error) => {
            if (error) {
                console.error('Erreur de connexion SMTP :', error);
                throw new Error('Impossible de se connecter au serveur SMTP');
            }
            console.log('Connexion SMTP réussie');
        });
    }
    async sendMail(to, subject, text, html) {
        const mailOptions = {
            from: `"OwoMobile" <${config_1.Config.SMTP_USER}>`,
            to,
            subject,
            text,
            html,
        };
        try {
            await this.transporter.sendMail(mailOptions);
            console.log(`Email envoyé à ${to}`);
        }
        catch (error) {
            console.error('Erreur lors de l\'envoi de l\'email :', error);
            throw new Error('Erreur lors de l\'envoi de l\'email');
        }
    }
    async sendTransactionEmail(to, subject, body) {
        const mailOptions = {
            from: `"OwoMobile" <${config_1.Config.SMTP_USER}>`,
            to,
            subject,
            text: body,
        };
        try {
            await this.transporter.sendMail(mailOptions);
            console.log(`Email envoyé à ${to}`);
        }
        catch (error) {
            console.error('Erreur lors de l\'envoi de l\'email :', error);
            throw new Error('Erreur lors de l\'envoi de l\'email');
        }
    }
    async sendOTPEmail(email, otpCode, operationId) {
        console.log(`Envoi du code OTP: ${otpCode} à l'adresse e-mail : ${email} `);
        const mailOptions = {
            from: `"OwoMobile" <${config_1.Config.SMTP_USER}>`,
            to: email,
            subject: 'Code OTP pour la validation de l\'opération ',
            text: `Votre code OTP est : ${otpCode} pour l\'opération : ${operationId}. Ce code est valide pendant 5 minutes.`,
        };
        try {
            await this.transporter.sendMail(mailOptions);
            console.log(`Email envoyé à ${email}`);
        }
        catch (error) {
            console.error('Erreur lors de l\'envoi de l\'email :', error);
            throw new Error('Erreur lors de l\'envoi de l\'email');
        }
    }
    async sendDebitedEmail(debiteurEmail, debiteurNom, crediteurNom, montant, devise, motif, montantOp, frais) {
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
    async sendDebitedEmailDepot(debiteurEmail, debiteurNom, crediteurNom, montant, devise, motif) {
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
    async sendCreditedEmail(crediteurEmail, crediteurNom, debiteurNom, montant, devise, motif) {
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
};
exports.MailService = MailService;
exports.MailService = MailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], MailService);
//# sourceMappingURL=mail.service.js.map