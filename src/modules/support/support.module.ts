import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectMember } from '../projects/entities/project-member.entity';
import { Project } from '../projects/entities/project.entity';
import { SupportInquiry } from './entities/support-inquiry.entity';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';

@Module({
  imports: [TypeOrmModule.forFeature([SupportInquiry, Project, ProjectMember])],
  controllers: [SupportController],
  providers: [SupportService],
})
export class SupportModule {}
