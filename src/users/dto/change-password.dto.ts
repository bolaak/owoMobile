// src/auth/dto/change-password.dto.ts
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8) // Exemple : Mot de passe minimum 8 caractères
  newPassword: string;
}

export class ChangePINDto {
  @IsString()
  @IsNotEmpty()
  oldPIN: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8) // Exemple : Mot de passe minimum 8 caractères
  newPIN: string;
}