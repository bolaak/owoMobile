import { CodesRechargeService } from './codes-recharge.service';
import { CreateCodeRechargeDto } from './dto/create-code-recharge.dto';
export declare class CodesRechargeController {
    private readonly codesRechargeService;
    constructor(codesRechargeService: CodesRechargeService);
    getAllCodesRecharge(): Promise<any>;
    getCodeRechargeById(id: string): Promise<any>;
    createCodeRecharge(codeData: CreateCodeRechargeDto): Promise<any>;
    updateCodeRecharge(id: string, updatedData: any): Promise<{
        message: string;
    }>;
    deleteCodeRecharge(id: string): Promise<{
        message: string;
    }>;
}
