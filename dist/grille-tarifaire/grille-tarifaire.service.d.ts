export declare class GrilleTarifaireService {
    private base;
    constructor();
    getAllGrilleTarifaire(): Promise<any>;
    getGrilleTarifaireById(id: string): Promise<any>;
    createGrilleTarifaire(grilleData: any): Promise<any>;
    updateGrilleTarifaire(id: string, updatedData: any): Promise<{
        message: string;
    }>;
    deleteGrilleTarifaire(id: string): Promise<{
        message: string;
    }>;
    validatePlageMontant(min_montant: number, max_montant: number, pays_id: string, type_operation: string): Promise<void>;
    checkCountryExists(countryId: string): Promise<void>;
    getGrilleTarifaireByCountryId(countryId: string): Promise<any[]>;
    getFraisOperation(pays_id: string, type_operation: string, montant: number): Promise<number>;
}
