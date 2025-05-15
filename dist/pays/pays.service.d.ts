export declare class PaysService {
    private base;
    constructor();
    getAllPays(): Promise<any>;
    getPaysById(id: string): Promise<any>;
    createPays(paysData: any): Promise<any>;
    updatePays(id: string, updatedData: any): Promise<{
        message: string;
    }>;
    deletePays(id: string): Promise<{
        message: string;
    }>;
    updatePaysStatus(id: string, status: string): Promise<{
        message: string;
    }>;
}
