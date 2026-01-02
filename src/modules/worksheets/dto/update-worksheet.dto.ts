import { PartialType } from '@nestjs/mapped-types';
import { CreateWorksheetDto } from './create-worksheet.dto';

export class UpdateWorksheetDto extends PartialType(CreateWorksheetDto) {}
