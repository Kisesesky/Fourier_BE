import { Injectable } from '@nestjs/common';
import { CreateWorksheetDto } from './dto/create-worksheet.dto';
import { UpdateWorksheetDto } from './dto/update-worksheet.dto';

@Injectable()
export class WorksheetsService {
  create(createWorksheetDto: CreateWorksheetDto) {
    return 'This action adds a new worksheet';
  }

  findAll() {
    return `This action returns all worksheets`;
  }

  findOne(id: number) {
    return `This action returns a #${id} worksheet`;
  }

  update(id: number, updateWorksheetDto: UpdateWorksheetDto) {
    return `This action updates a #${id} worksheet`;
  }

  remove(id: number) {
    return `This action removes a #${id} worksheet`;
  }
}
