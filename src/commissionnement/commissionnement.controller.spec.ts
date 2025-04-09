import { Test, TestingModule } from '@nestjs/testing';
import { CommissionnementController } from './commissionnement.controller';

describe('CommissionnementController', () => {
  let controller: CommissionnementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommissionnementController],
    }).compile();

    controller = module.get<CommissionnementController>(CommissionnementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
