import { SignUpDto } from "../dto/sign-up.dto";

// src/modules/auth/types/sign-up-command.type.ts
export interface SignUpCommand extends SignUpDto {
  avatarUrl: string;
}