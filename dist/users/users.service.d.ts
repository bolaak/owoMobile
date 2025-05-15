import { MailService } from '../mail/mail.service';
import { TransactionsService } from '../transactions/transactions.service';
import { GrilleTarifaireService } from '../grille-tarifaire/grille-tarifaire.service';
import { CompteSystemeService } from '../compte-systeme/compte-systeme.service';
import { CommissionnementService } from '../commissionnement/commissionnement.service';
export declare class UsersService {
    private readonly mailService;
    private readonly grilleTarifaireService;
    private readonly compteSystemeService;
    private readonly commissionsService;
    private readonly transactionsService;
    private base;
    constructor(mailService: MailService, grilleTarifaireService: GrilleTarifaireService, compteSystemeService: CompteSystemeService, commissionsService: CommissionnementService, transactionsService: TransactionsService);
    private readonly allowedFields;
    createUser(userData: any): Promise<{
        numero_compte: string;
    }>;
    validatePIN(numero_compte: string, pin: string): Promise<boolean>;
    checkEmailUniqueness(email: string): Promise<void>;
    checkCountryExists(pays_id: string): Promise<void>;
    getUserById(id: string): Promise<any>;
    getUserByNumeroCompte(numero_compte: string): Promise<any>;
    validateDifferentAccounts(numeroCompte1: string, numeroCompte2: string): Promise<void>;
    validateSameCountry(numeroCompte1: string, numeroCompte2: string): Promise<void>;
    validateUserType(userId: string, userType: string): Promise<void>;
    validateSolde(userId: string, montant: number): Promise<void>;
    updateSolde(userId: string, newSolde: number): Promise<void>;
    getAllUsers(): Promise<any>;
    updateUser(id: string, updatedData: any): Promise<{
        message: string;
    }>;
    deleteUser(id: string): Promise<{
        message: string;
    }>;
    generateNewPIN(id: string): Promise<string>;
    sendPINToUser(numero_compte: string): Promise<{
        message: string;
    }>;
    checkUserStatus(numero_compte: string): Promise<void>;
    checkUserStatusMaster(numero_compte: string): Promise<void>;
    checkUserStatusMarchand(numero_compte: string): Promise<void>;
    incrementFailedAttempts(numero_compte: string): Promise<void>;
    resetFailedAttempts(numero_compte: string): Promise<void>;
    unlockUser(numero_compte: string): Promise<{
        message: string;
    }>;
    blockUser(numero_compte: string): Promise<void>;
    generateNewPassword(id: string): Promise<string>;
    sendPasswordToUser(numero_compte: string): Promise<{
        message: string;
    }>;
    changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void>;
    checkCountryStatus(countryId: string): Promise<void>;
    checkCountryStatusForUser(userId: string): Promise<void>;
    checkCountryStatusForClient(userId: string): Promise<void>;
    checkCountryStatusForMarchand(userId: string): Promise<void>;
    isMerchantCodeUnique(merchantCode: string): Promise<boolean>;
    generateUniqueMerchantCode(): Promise<string>;
    validateMerchantCode(merchantCode: string): Promise<any>;
    getMarchandsByMaster(masterId: string): Promise<any[]>;
    getMasterByMarchand(marchandId: string): Promise<any>;
    getAllMasters(): Promise<any>;
    shareCommissions(typeOperation: string, paysId: string, montantFrais: number, marchandNumeroCompte: string, compteSysteme: any): Promise<void>;
    shareCommissionsDepot(typeOperation: string, paysId: string, montant: number, marchandNumeroCompte: string, compteSysteme: any): Promise<void>;
    getAdminAccount(): Promise<any>;
    getTaxeAccount(): Promise<any>;
    getMarchandsByMasterId(masterId: string): Promise<any[]>;
    creditSolde(userId: string, montant: number): Promise<{
        solde: any;
    }>;
    validateOTP(userId: string, destinataireId: string, otpCode: string, montant: number): Promise<boolean>;
    generateOTP(userId: string, destinataireId: string, montant: number): Promise<string>;
    executerOperation(master_numero_compte: string, marchand_numero_compte: string, montant: number, motif: string): Promise<{
        transaction_id: any;
        nouveau_solde_master: number;
        nouveau_solde_marchand: any;
    }>;
    executerOperationDepot(marchand_numero_compte: string, client_numero_compte: string, montant: number, motif: string): Promise<{
        transaction_id: any;
        nouveau_solde_marchand: number;
        nouveau_solde_client: any;
    }>;
    executerOperationTransfert(client1_numero_compte: string, client2_numero_compte: string, montant: number, motif: string): Promise<{
        transaction_id: any;
        nouveau_solde_client1: number;
        nouveau_solde_client2: any;
    }>;
    executerOperationRetrait(client_numero_compte: string, marchand_numero_compte: string, montant: number, motif: string): Promise<{
        transaction_id: any;
        nouveau_solde_client: number;
    }>;
    exchangeBalance(typeOperation: string, direction: 'SYSTEM_TO_ADMIN' | 'ADMIN_TO_SYSTEM', montant: number): Promise<void>;
    executerOperationPayment(marchand_numero_compte: string, client_numero_compte: string, montant: number, motif: string): Promise<{
        transaction_id: any;
        nouveau_solde_marchand: any;
        nouveau_solde_client: number;
    }>;
}
