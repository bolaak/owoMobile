import { Test, TestingModule } from '@nestjs/testing';
import { CompteSystemeService } from './compte-systeme.service';

describe('CompteSystemeService', () => {
  let service: CompteSystemeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CompteSystemeService],
    }).compile();

    service = module.get<CompteSystemeService>(CompteSystemeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
