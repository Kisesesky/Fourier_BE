// src/modules/users/users.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, BadRequestException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { UsersService } from './users.service';
import { SignUpDto } from '../auth/dto/sign-up.dto';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RequestUser } from 'src/common/decorators/request-user.decorator';
import { User } from './entities/user.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('사용자')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: '유저 등록' })
  @Post('create')
  create(@Body() signUpdto: SignUpDto) {
    return this.usersService.createLocalUser(signUpdto);
  }
  
  @ApiOperation({ summary: '프로필 변경' })
  @Patch('update')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('avatar', {
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.startsWith('image/')) {
        return cb(new BadRequestException('이미지 파일만 업로드 할 수 있습니다.'), false);
      }
      cb(null, true);
    },
  }))
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
}
