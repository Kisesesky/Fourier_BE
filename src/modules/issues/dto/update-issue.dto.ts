// src/modules/issue/dto/update-issue.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateIssueDto } from './create-issue.dto';

export class UpdateIssueDto extends PartialType(CreateIssueDto) {}