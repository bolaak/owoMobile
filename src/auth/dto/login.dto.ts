// src/auth/dto/login.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  numero_compte: string;

  @IsString()
  @IsNotEmpty()
  mot_de_passe: string;
}