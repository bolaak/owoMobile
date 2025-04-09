import { Test, TestingModule } from '@nestjs/testing';
import { GrilleTarifaireService } from './grille-tarifaire.service';

describe('GrilleTarifaireService', () => {
  let service: GrilleTarifaireService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GrilleTarifaireService],
    }).compile();

    service = module.get<GrilleTarifaireService>(GrilleTarifaireService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
