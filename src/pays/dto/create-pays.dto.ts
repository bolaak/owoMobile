// src/pays/dto/create-pays.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';

export class CreatePaysDto {
  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsString()
  @IsNotEmpty()
  devise_code: string;

  @IsString()
  @IsNotEmpty()
  devise_nom: string;

  @IsString()
  @IsNotEmpty()
  code_pays: string;
}

