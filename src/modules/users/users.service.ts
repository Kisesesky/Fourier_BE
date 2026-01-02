// src/modules/users/users.service.ts
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { SignUpDto } from '../auth/dto/sign-up.dto';
import { REGISTER_STATUS, RegisterStatus } from 'src/common/constants/register-status';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>
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
      provider: REGISTER_STATUS.LOCAL,
      avatarUrl: '',
      agreedTerms: signUpDto.agreedTerms,
      agreedPrivacy: signUpDto.agreedPrivacy
    });

    return await this.usersRepository.save(newUser);
  }

  async findByUserEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { email } });
  }

  async findUserBySocialId(providerId: string, provider: RegisterStatus): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { providerId, provider } });
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
}
