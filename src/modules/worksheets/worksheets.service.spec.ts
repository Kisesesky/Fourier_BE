import { Test, TestingModule } from '@nestjs/testing';
import { WorksheetsService } from './worksheets.service';

describe('WorksheetsService', () => {
  let service: WorksheetsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorksheetsService],
    }).compile();

    service = module.get<WorksheetsService>(WorksheetsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
