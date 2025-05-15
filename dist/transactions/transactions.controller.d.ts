import { CodesRechargeService } from '../codes-recharge/codes-recharge.service';
import { UsersService } from '../users/users.service';
import { TransactionsService } from './transactions.service';
import { GrilleTarifaireService } from '../grille-tarifaire/grille-tarifaire.service';
export declare class TransactionsController {
    private readonly codesRechargeService;
    private readonly usersService;
    private readonly grilleTarifaireService;
    private readonly transactionsService;
    constructor(codesRechargeService: CodesRechargeService, usersService: UsersService, grilleTarifaireService: GrilleTarifaireService, transactionsService: TransactionsService);
    rechargeCompte(rechargeData: {
        master_id: string;
        code: string;
    }): Promise<{
        message: string;
        nouveau_solde: any;
    }>;
    approvisionnerMarchand(approvisionnementData: {
        master_numero_compte: string;
        marchand_numero_compte: string;
        montant: number;
        motif: string;
        pin: string;
    }): Promise<{
        message: string;
    }>;
    validerOperation(validationData: {
        master_numero_compte: string;
        marchand_numero_compte: string;
        montant: number;
        motif: string;
        otpCode: string;
    }): Promise<{
        transaction_id: any;
        nouveau_solde_master: number;
        nouveau_solde_marchand: any;
        message: string;
    }>;
    approvisionnerClient(approvisionnementData: {
        client_numero_compte: string;
        marchand_numero_compte: string;
        montant: number;
        motif: string;
        pin: string;
    }): Promise<{
        message: string;
    }>;
    validerDepot(validationData: {
        client_numero_compte: string;
        marchand_numero_compte: string;
        montant: number;
        motif: string;
        otpCode: string;
    }): Promise<{
        transaction_id: any;
        nouveau_solde_marchand: number;
        nouveau_solde_client: any;
        message: string;
    }>;
    transfert(transfertData: {
        client1_numero_compte: string;
        client2_numero_compte: string;
        montant: number;
        motif: string;
        pin: string;
    }): Promise<{
        message: string;
    }>;
    validerTransfert(validationData: {
        client1_numero_compte: string;
        client2_numero_compte: string;
        montant: number;
        motif: string;
        otpCode: string;
    }): Promise<{
        transaction_id: any;
        nouveau_solde_client1: number;
        nouveau_solde_client2: any;
        message: string;
    }>;
    retraitClient(approvisionnementData: {
        marchand_numero_compte: string;
        client_numero_compte: string;
        montant: number;
        pin: string;
    }): Promise<{
        message: string;
    }>;
    validerRetrait(validationData: {
        client_numero_compte: string;
        marchand_numero_compte: string;
        montant: number;
        motif: string;
        otpCode: string;
    }): Promise<{
        transaction_id: any;
        nouveau_solde_client: number;
        message: string;
    }>;
    exchangeBalance(exchangeData: {
        typeOperation: string;
        direction: 'SYSTEM_TO_ADMIN' | 'ADMIN_TO_SYSTEM';
        montant: number;
    }): Promise<{
        message: string;
    }>;
    payment(approvisionnementData: {
        client_numero_compte: string;
        marchand_numero_compte: string;
        montant: number;
        motif: string;
        pin: string;
    }): Promise<{
        message: string;
    }>;
    validerPayment(validationData: {
        client_numero_compte: string;
        marchand_numero_compte: string;
        montant: number;
        motif: string;
        otpCode: string;
    }): Promise<{
        transaction_id: any;
        nouveau_solde_marchand: any;
        nouveau_solde_client: number;
        message: string;
    }>;
}
