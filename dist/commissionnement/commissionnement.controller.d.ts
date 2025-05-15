import { CommissionnementService } from './commissionnement.service';
import { CreateCommissionnementDto } from './dto/create-commissionnement.dto';
export declare class CommissionnementController {
    private readonly commissionnementService;
    constructor(commissionnementService: CommissionnementService);
    getAllCommissionnements(): Promise<any>;
    getCommissionnementById(id: string): Promise<any>;
    createCommissionnement(commissionData: CreateCommissionnementDto): Promise<any>;
    updateCommissionnement(id: string, updatedData: any): Promise<{
        message: string;
    }>;
    deleteCommissionnement(id: string): Promise<{
        message: string;
    }>;
}
