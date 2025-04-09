// src/grille-tarifaire/dto/create-grille-tarifaire.dto.ts
import { IsNumber, IsNotEmpty, Min, IsString, IsIn } from 'class-validator';

export class CreateGrilleTarifaireDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  min_montant: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  max_montant: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  frais: number;

  @IsString()
  @IsNotEmpty()
  @IsIn(['DEPOT', 'RETRAIT', 'TRANSFERT'])
  type_operation: string;
}