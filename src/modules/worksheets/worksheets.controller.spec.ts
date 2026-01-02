import { Test, TestingModule } from '@nestjs/testing';
import { WorksheetsController } from './worksheets.controller';
import { WorksheetsService } from './worksheets.service';

describe('WorksheetsController', () => {
  let controller: WorksheetsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorksheetsController],
      providers: [WorksheetsService],
    }).compile();

    controller = module.get<WorksheetsController>(WorksheetsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
