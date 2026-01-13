// src/modules/users/users.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, BadRequestException, UseInterceptors, UploadedFile, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { SignUpDto } from '../auth/dto/sign-up.dto';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RequestUser } from 'src/common/decorators/request-user.decorator';
import { User } from './entities/user.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('users')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: '유저 등록 (관리자 직접등록)' })
  @Post('create')
  create(
    @Body() signUpdto: SignUpDto
  ) {
    return this.usersService.createLocalUser(signUpdto);
  }
  
  @ApiOperation({ summary: '프로필 변경' })
  @ApiOkResponse({
    schema: {
      example: { success: true, message: '프로필이 업데이트되었습니다.' },
    },
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: { type: 'string', format: 'binary', nullable: true },
        displayName: { type: 'string', example: '김철수' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('avatar', {
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.startsWith('image/')) {
        return cb(new BadRequestException('이미지 파일만 업로드 할 수 있습니다.'), false);
      }
      cb(null, true);
    },
  }))
  @Patch('update')
  async updateUser(
    @RequestUser() user: User,
    @UploadedFile() file: Express.Multer.File,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    let updatedAvatar: string | undefined;

    if (file) {
      updatedAvatar = await this.usersService.updateAvatar(user, file);
    }

    if (updateUserDto.displayName) {
      await this.usersService.updateName(user.id, updateUserDto.displayName);
    }

    return { success: true, message: '프로필이 업데이트되었습니다.' };
  }

  @ApiOperation({ summary: '유저 검색' })
  @ApiQuery({
    name: 'q',
    required: true,
    example: 'kim',
    description: '검색 키워드 (2자 이상)',
  })
  @Get('search')
  searchUsers(
    @RequestUser() user: User,
    @Query('q') keyword: string
  ) {
    if (!keyword || keyword.length < 2) {
      throw new BadRequestException('검색어는 2자 이상이어야 합니다.');
    }

    return this.usersService.searchUsersForMember(user.id, keyword);
  }
}
