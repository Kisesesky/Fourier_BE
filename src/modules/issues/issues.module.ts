import { Module } from '@nestjs/common';
import { IssuesController } from './issues.controller';
import { IssuesService } from './issues.service';
import { Project } from '../projects/entities/project.entity';
import { Issue } from './entities/issue.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IssueComment } from './entities/issue-comment.entity';
import { User } from '../users/entities/user.entity';
import { IssuesGateway } from './issue.gateway';

@Module({
  imports:[
    TypeOrmModule.forFeature([Project, Issue, IssueComment, User]),
  ],
  controllers: [IssuesController],
  providers: [IssuesService, IssuesGateway],
  exports: [IssuesService]
})
export class IssuesModule {}
