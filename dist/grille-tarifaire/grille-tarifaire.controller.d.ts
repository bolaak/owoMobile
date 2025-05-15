import { GrilleTarifaireService } from './grille-tarifaire.service';
import { CreateGrilleTarifaireDto } from './dto/create-grille-tarifaire.dto';
export declare class GrilleTarifaireController {
    private readonly grilleTarifaireService;
    constructor(grilleTarifaireService: GrilleTarifaireService);
    getAllGrilleTarifaire(): Promise<any>;
    getGrilleTarifaireById(id: string): Promise<any>;
    createGrilleTarifaire(grilleData: CreateGrilleTarifaireDto): Promise<any>;
    updateGrilleTarifaire(id: string, updatedData: any): Promise<{
        message: string;
    }>;
    deleteGrilleTarifaire(id: string): Promise<{
        message: string;
    }>;
    getGrilleTarifaireByCountryId(paysId: string): Promise<any[]>;
}
