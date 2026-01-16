import { Test, TestingModule } from '@nestjs/testing';
import { CommissionnementService } from './commissionnement.service';

describe('CommissionnementService', () => {
  let service: CommissionnementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommissionnementService],
    }).compile();

    service = module.get<CommissionnementService>(CommissionnementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
