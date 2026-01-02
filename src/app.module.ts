import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { ChatModule } from './modules/chat/chat.module';
import { IssuesModule } from './modules/issues/issues.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { DocsModule } from './modules/docs/docs.module';
import { MembersModule } from './modules/members/members.module';
import { WorksheetsModule } from './modules/worksheets/worksheets.module';
import { UsersModule } from './modules/users/users.module';
import { ConfigRootModule } from './config/config.module';
import { AppConfigModule } from './config/app/config.module';
import { DbConfigModule } from './config/db/config.module';
import { DatabaseModule } from './modules/database/database.module';

@Module({
  imports: [
    DatabaseModule,
    ConfigRootModule, DbConfigModule, AppConfigModule, AuthModule, ChatModule, IssuesModule, CalendarModule, DocsModule, MembersModule, WorksheetsModule, UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
