import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { WorksheetsService } from './worksheets.service';
import { CreateWorksheetDto } from './dto/create-worksheet.dto';
import { UpdateWorksheetDto } from './dto/update-worksheet.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('worksheets')
@Controller('worksheets')
export class WorksheetsController {
  constructor(private readonly worksheetsService: WorksheetsService) {}

  @Post()
  create(@Body() createWorksheetDto: CreateWorksheetDto) {
    return this.worksheetsService.create(createWorksheetDto);
  }

  @Get()
  findAll() {
    return this.worksheetsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.worksheetsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWorksheetDto: UpdateWorksheetDto) {
    return this.worksheetsService.update(+id, updateWorksheetDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.worksheetsService.remove(+id);
  }
}
