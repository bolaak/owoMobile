import { Test, TestingModule } from '@nestjs/testing';
import { CodesRechargeService } from './codes-recharge.service';

describe('CodesRechargeService', () => {
  let service: CodesRechargeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CodesRechargeService],
    }).compile();

    service = module.get<CodesRechargeService>(CodesRechargeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
