import { PaysService } from './pays.service';
import { CreatePaysDto } from './dto/create-pays.dto';
export declare class PaysController {
    private readonly paysService;
    constructor(paysService: PaysService);
    getAllPays(): Promise<any>;
    getPaysById(id: string): Promise<any>;
    createPays(paysData: CreatePaysDto): Promise<any>;
    updatePays(id: string, updatedData: any): Promise<{
        message: string;
    }>;
    deletePays(id: string): Promise<{
        message: string;
    }>;
    activatePays(id: string): Promise<{
        message: string;
    }>;
    deactivatePays(id: string): Promise<{
        message: string;
    }>;
    suspendPays(id: string): Promise<{
        message: string;
    }>;
}
