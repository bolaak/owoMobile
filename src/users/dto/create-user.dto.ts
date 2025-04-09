// src/users/dto/create-user.dto.ts
import { IsString, IsEmail, IsNotEmpty, IsNumberString } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsString()
  @IsNotEmpty()
  prenom: string;

  @IsEmail()
  email: string;

  @IsNumberString()
  telephone: string;

  @IsString()
  adresse: string;

  @IsString()
  pays_id: string;

  @IsString()
  city: string;

  @IsString()
  type_utilisateur: string;
}