// src/grille-tarifaire/dto/create-grille-tarifaire.dto.ts
import { IsNumber, IsNotEmpty, Min, IsString, IsIn } from 'class-validator';

export class CreateGrilleTarifaireDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  min_montant: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  max_montant: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  frais: number;

  @IsString()
  @IsNotEmpty()
  @IsIn(['DEPOT', 'RETRAIT', 'TRANSFERT', 'DEPOT_INTER'])
  type_operation: string;

  @IsString()
  @IsNotEmpty()
  pays_id: string;
}