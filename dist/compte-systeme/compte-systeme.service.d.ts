export declare class CompteSystemeService {
    private base;
    constructor();
    getAllComptesSysteme(): Promise<any>;
    getCompteSystemeById(id: string): Promise<any>;
    createCompteSysteme(compteData: any): Promise<any>;
    updateCompteSysteme(id: string, updatedData: any): Promise<{
        message: string;
    }>;
    deleteCompteSysteme(id: string): Promise<{
        message: string;
    }>;
    isTypeOperationUnique(typeOperation: string): Promise<boolean>;
    getCompteSystemeByTypeOperation(typeOperation: string): Promise<any>;
    crediterCompteSysteme(compteId: string, montant: number): Promise<void>;
    debiterCompteSysteme(compteId: string, montant: number): Promise<void>;
    updateSoldeSysteme(compteId: string, newSolde: number): Promise<void>;
}
