// src/compte-systeme/dto/create-compte-systeme.dto.ts
import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class CreateCompteSystemeDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['DEPOT', 'RETRAIT', 'TRANSFERT', 'CONVERSION'])
  typeOperation: string;
}