import { Test, TestingModule } from '@nestjs/testing';
import { GrilleTarifaireController } from './grille-tarifaire.controller';

describe('GrilleTarifaireController', () => {
  let controller: GrilleTarifaireController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GrilleTarifaireController],
    }).compile();

    controller = module.get<GrilleTarifaireController>(GrilleTarifaireController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
