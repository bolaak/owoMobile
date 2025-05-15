export declare class CodesRechargeService {
    private base;
    constructor();
    getAllCodesRecharge(): Promise<any>;
    getCodeRechargeById(id: string): Promise<any>;
    createCodeRecharge(codeData: any): Promise<any>;
    updateCodeRecharge(id: string, updatedData: any): Promise<{
        message: string;
    }>;
    deleteCodeRecharge(id: string): Promise<{
        message: string;
    }>;
    validateMasterId(masterId: string): Promise<void>;
    hasActiveCode(masterId: string): Promise<boolean>;
    isMasterActivated(masterId: string): Promise<boolean>;
    isCountryActivated(masterId: string): Promise<boolean>;
    useCodeRecharge(masterId: string, code: string): Promise<{
        montant: any;
    }>;
    getCodeRechargeIdByCode(code: string): Promise<string>;
}
