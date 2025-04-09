import { Module } from '@nestjs/common';
import { GrilleTarifaireService } from './grille-tarifaire.service';
import { GrilleTarifaireController } from './grille-tarifaire.controller';

@Module({
  providers: [GrilleTarifaireService],
  controllers: [GrilleTarifaireController],
  exports: [GrilleTarifaireService],
})
export class GrilleTarifaireModule {}
