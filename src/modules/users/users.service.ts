// src/modules/users/users.service.ts
import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { SignUpDto } from '../auth/dto/sign-up.dto';
import { REGISTER_STATUS, RegisterStatus } from 'src/common/constants/register-status';
import { GcsService } from '../gcs/gcs.service';
import { AppConfigService } from 'src/config/app/config.service';
import { WorkspaceService } from '../workspace/workspace.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private gcsService: GcsService,
    private appConfigService: AppConfigService,
    private workspaceService: WorkspaceService,
  ) {}

  async createLocalUser(signUpDto: SignUpDto): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: signUpDto.email },
    });
    if (existingUser) {
      throw new BadRequestException('이미 사용 중인 이메일입니다.')
    }

    const newUser = this.usersRepository.create({
      ...signUpDto,
      displayName: signUpDto.displayName ?? signUpDto.name,
      provider: REGISTER_STATUS.LOCAL,
      avatarUrl: '',
      agreedTerms: signUpDto.agreedTerms,
      agreedPrivacy: signUpDto.agreedPrivacy
    });

    const savedUser = await this.usersRepository.save(newUser);
    await this.workspaceService.createDefaultWorkspace(savedUser);

    return savedUser;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { email } });
  }

  async findUserBySocialId(providerId: string, provider: RegisterStatus): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { providerId, provider } });
  }

  async findUserById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findOrCreateSocialUser(
    params: 
      {
        provider: RegisterStatus;
        providerId: string;
        email: string;
        name?: string;
        avatar?: string;
      }
  ): Promise<User> {
    const { provider, providerId, email, name, avatar } = params;

    const user = await this.usersRepository.findOne({ where: { providerId, provider } });
    if (user) {
      this.logger.debug(`소셜 로그인 성공: 기존 사용자 (ID: ${user.id})`);
      return user;
    }
    if (email) {
      const existingUserByEmail = await this.usersRepository.findOne({ where: { email } });

      if (existingUserByEmail) {
        this.logger.warn(`이메일로 기존 사용자와 연동: ${email}`);

        existingUserByEmail.providerId = providerId;
        existingUserByEmail.provider = provider;

        if (name && !existingUserByEmail.name?.startsWith('소셜 사용자')) {
          existingUserByEmail.name = name;
        }
        if (avatar) {
          existingUserByEmail.avatarUrl = avatar;
        }

        const updatedUser = await this.usersRepository.save(existingUserByEmail);
        await this.workspaceService.createDefaultWorkspace(updatedUser);
        return updatedUser;
      }
    }

    const newUserData: Partial<User> = {
      providerId,
      provider,
      email: email,
      name: name ?? '소셜 사용자',
      avatarUrl: avatar,
    };

    const newUser = this.usersRepository.create(newUserData);
    const savedUser = await this.usersRepository.save(newUser);

    this.logger.log(`새 소셜 사용자 생성 (ID: ${savedUser.id}, provider: ${provider})`);

    return savedUser;
  }

  async updatePassword(email: string, hashedPassword: string) {
    const user = await this.usersRepository.findOne({ where: { email }});
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }
    user.password = hashedPassword;
    return this.usersRepository.save(user);
  }

  async updateName(userId: string, displayName: string) {
    const exists = await this.usersRepository.findOne({ where : { name: displayName }})
    if (exists) {
      throw new BadRequestException('이미 사용 중인 이름입니다.');
    }
    await this.usersRepository.update(userId, { name: displayName });
  }

  async updateAvatar(user: User, file?: Express.Multer.File) {
    const oldAvatar = user.avatarUrl;

    const newAvatar = file
      ? await this.gcsService.uploadFile(file)
      : this.appConfigService.defaultAvatar;

    user.avatarUrl = newAvatar;
    await this.usersRepository.save(user);

    if (oldAvatar && oldAvatar !== this.appConfigService.defaultAvatar) {
      await this.gcsService.deleteFile(oldAvatar);
    }

    return newAvatar;
  }

  async searchUsersForMember(userId: string, keyword: string) {
    return this.usersRepository
      .createQueryBuilder('user')
      .where('user.id != :userId', { userId })
      .andWhere(
        `(user.email ILIKE :keyword OR user.name ILIKE :keyword OR user.displayName ILIKE :keyword)`,
        { keyword: `%${keyword}`}
      )
      .andWhere(qb => {
        const subQuery = qb
          .subQuery()
          .select('1')
          .from('members', 'm')
          .where(
            `(m.requesterId = :userId AND m.recipientId = user.id)
            OR (m.recipientId = :userId AND m.requesterId = user.id)`
          )
          .getQuery();
        return `NOT EXISTS ${subQuery}`;
      })
      .setParameter('userID', userId)
      .getMany();
  }
}
