import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { ChatModule } from './modules/chat/chat.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { DocsModule } from './modules/docs/docs.module';
import { MembersModule } from './modules/members/members.module';
import { UsersModule } from './modules/users/users.module';
import { ConfigRootModule } from './config/config.module';
import { AppConfigModule } from './config/app/config.module';
import { DbConfigModule } from './config/db/config.module';
import { DatabaseModule } from './modules/database/database.module';
import { GcsModule } from './modules/gcs/gcs.module';
import { VerificationModule } from './modules/verification/verification.module';
import { WorkspaceModule } from './modules/workspace/workspace.module';
import { TeamModule } from './modules/team/team.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { NotificationModule } from './modules/notification/notification.module';
import { FilesModule } from './modules/files/files.module';
import { IssuesModule } from './modules/issues/issues.module';
import { ActivityLogModule } from './modules/activity-log/activity-log.module';
import { MentionModule } from './modules/mention/mention.module';

@Module({
  imports: [
    DatabaseModule,
    ConfigRootModule, DbConfigModule, AppConfigModule, AuthModule, ChatModule, IssuesModule, CalendarModule, DocsModule, MembersModule, UsersModule, GcsModule, VerificationModule, WorkspaceModule, TeamModule, ProjectsModule, NotificationModule, FilesModule, ActivityLogModule, MentionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
