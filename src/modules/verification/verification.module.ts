import { Module } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { VerificationController } from './verification.controller';
import { UsersModule } from '../users/users.module';
import { AppConfigModule } from 'src/config/app/config.module';
import { RedisConfigModule } from 'src/config/redis/config.module';
import { MatchPasswordConstraint } from 'src/common/validators/match-password.constraint';

@Module({
  imports: [UsersModule, AppConfigModule, RedisConfigModule],
  controllers: [VerificationController],
  providers: [VerificationService, MatchPasswordConstraint],
  exports: [VerificationService]
})
export class VerificationModule {}
