// src/codes-recharge/dto/create-code-recharge.dto.ts
import { IsNumber, IsNotEmpty, Min, Validate, IsString } from 'class-validator';
import { IsMasterExists } from '../../validators/is-master-exists.validator';

export class CreateCodeRechargeDto {
  @IsNumber()
  @Min(6)
  @IsNotEmpty()
  montant: number;

  /*@IsNotEmpty()
  @Validate(IsMasterExists, {
    message: 'Le Master spécifié (ID: $value) est introuvable ou n\'est pas de type MASTER.',
  })
  master_id: string;*/

  @IsString()
  @IsNotEmpty()
  master_id: string; // ID du Master pour qui le code est créé
}