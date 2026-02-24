import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequestUser } from 'src/common/decorators/request-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { CreateSupportInquiryDto } from './dto/create-support-inquiry.dto';
import { SupportService } from './support.service';

@ApiTags('support')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @ApiOperation({ summary: '고객센터 문의 접수' })
  @Post('inquiries')
  async createInquiry(
    @RequestUser() user: User,
    @Body() dto: CreateSupportInquiryDto,
  ) {
    return this.supportService.createInquiry(dto, user);
  }
}
