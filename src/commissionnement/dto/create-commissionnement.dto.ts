// src/commissionnement/dto/create-commissionnement.dto.ts
import { IsString, IsNotEmpty, IsIn, IsNumber, Min } from 'class-validator';

export class CreateCommissionnementDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['MARCHAND', 'MASTER', 'ADMIN', 'TAXE'])
  typeUtilisateur: string;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  pourcentage: number;

  @IsString()
  @IsNotEmpty()
  @IsIn(['DEPOT', 'RETRAIT', 'TRANSFERT','DEPOT_INTER', 'RETRAIT_INTER', 'TRANSFERT_INTER'])
  typeOperation: string;

  @IsString()
  @IsNotEmpty()
  pays_id: string;
}