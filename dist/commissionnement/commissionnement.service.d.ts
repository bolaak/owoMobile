export declare class CommissionnementService {
    private base;
    constructor();
    getAllCommissionnements(): Promise<any>;
    getCommissionnementById(id: string): Promise<any>;
    createCommissionnement(commissionData: any): Promise<any>;
    updateCommissionnement(id: string, updatedData: any): Promise<{
        message: string;
    }>;
    deleteCommissionnement(id: string): Promise<{
        message: string;
    }>;
    private isValidTypeUtilisateur;
    isTypeUtilisateurUnique(typeUtilisateur: string): Promise<boolean>;
    getCommissionsByOperation(typeOperation: string, paysId: string): Promise<any[]>;
}
