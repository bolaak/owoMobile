import { Test, TestingModule } from '@nestjs/testing';
import { CodesRechargeController } from './codes-recharge.controller';

describe('CodesRechargeController', () => {
  let controller: CodesRechargeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CodesRechargeController],
    }).compile();

    controller = module.get<CodesRechargeController>(CodesRechargeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
