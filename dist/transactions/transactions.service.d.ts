export declare class TransactionsService {
    private base;
    constructor();
    createTransaction(transactionData: any): Promise<any>;
    createTransactionAppro(transactionData: any): Promise<any>;
    useCodeRecharge(masterId: string, code: string): Promise<{
        montant: any;
    }>;
    createCommissionTransaction(montant: number, compteCommissionId: string, destinataireId: string, description: string): Promise<void>;
}
