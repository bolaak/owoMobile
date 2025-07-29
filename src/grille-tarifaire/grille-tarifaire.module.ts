import { Module } from '@nestjs/common';
import { GrilleTarifaireService } from './grille-tarifaire.service';
import { GrilleTarifaireController } from './grille-tarifaire.controller';
import { PaysModule } from '../pays/pays.module';
import { PaysService } from '../pays/pays.service'

@Module({
   imports: [PaysModule],
  providers: [GrilleTarifaireService, PaysService],
  controllers: [GrilleTarifaireController],
  exports: [GrilleTarifaireService],
})
export class GrilleTarifaireModule {}
