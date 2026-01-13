import { Module } from '@nestjs/common';
import { IssueController } from './issues.controller';
import { IssueService } from './issues.service';
import { Project } from '../projects/entities/project.entity';
import { Issue } from './entities/issue.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IssueComment } from './entities/issue-comment.entity';
import { User } from '../users/entities/user.entity';
import { IssueGateway } from './issue.gateway';

@Module({
  imports:[
    TypeOrmModule.forFeature([Project, Issue, IssueComment, User]),
  ],
  controllers: [IssueController],
  providers: [IssueService, IssueGateway],
  exports: [IssueService]
})
export class IssuesModule {}
