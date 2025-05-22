// src/codes-recharge/dto/create-code-recharge.dto.ts
import { IsNumber, IsNotEmpty, Min, Validate, IsString, IsArray, IsOptional } from 'class-validator';
import { IsMasterExists } from '../../validators/is-master-exists.validator';

export class CreateCodeRechargeDto {
  //@IsNumber()
  @IsString()
  //@Min(6)
  @IsNotEmpty()
  montant: string; //number;

  @IsString()
  @IsNotEmpty()
  master_id: string; // ID du Master pour qui le code est créé

  @IsString()
  @IsNotEmpty()
  motif: string; 

  @IsOptional()
  @IsArray()
  //@IsString({ each: true })
  attached: string[];
}