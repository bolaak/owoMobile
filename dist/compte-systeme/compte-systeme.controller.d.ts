import { CompteSystemeService } from './compte-systeme.service';
import { CreateCompteSystemeDto } from './dto/create-compte-systeme.dto';
export declare class CompteSystemeController {
    private readonly compteSystemeService;
    constructor(compteSystemeService: CompteSystemeService);
    getAllComptesSysteme(): Promise<any>;
    getCompteSystemeById(id: string): Promise<any>;
    createCompteSysteme(compteData: CreateCompteSystemeDto): Promise<any>;
    updateCompteSysteme(id: string, updatedData: any): Promise<{
        message: string;
    }>;
    deleteCompteSysteme(id: string): Promise<{
        message: string;
    }>;
}
