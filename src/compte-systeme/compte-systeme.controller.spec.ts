import { Test, TestingModule } from '@nestjs/testing';
import { CompteSystemeController } from './compte-systeme.controller';

describe('CompteSystemeController', () => {
  let controller: CompteSystemeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompteSystemeController],
    }).compile();

    controller = module.get<CompteSystemeController>(CompteSystemeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
