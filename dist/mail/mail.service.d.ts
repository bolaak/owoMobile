export declare class MailService {
    private transporter;
    constructor();
    sendMail(to: string, subject: string, text: string, html?: string): Promise<void>;
    sendTransactionEmail(to: string, subject: string, body: string): Promise<void>;
    sendOTPEmail(email: string, otpCode: string, operationId: string): Promise<void>;
    sendDebitedEmail(debiteurEmail: string, debiteurNom: string, crediteurNom: string, montant: number, devise: string, motif: string, montantOp: number, frais: number): Promise<void>;
    sendDebitedEmailDepot(debiteurEmail: string, debiteurNom: string, crediteurNom: string, montant: number, devise: string, motif: string): Promise<void>;
    sendCreditedEmail(crediteurEmail: string, crediteurNom: string, debiteurNom: string, montant: number, devise: string, motif: string): Promise<void>;
}
