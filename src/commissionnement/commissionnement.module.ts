import { Module } from '@nestjs/common';
import { CommissionnementService } from './commissionnement.service';
import { CommissionnementController } from './commissionnement.controller';
import { PaysModule } from '../pays/pays.module';
import { PaysService } from '../pays/pays.service';



@Module({
 imports: [PaysModule],
  providers: [CommissionnementService, PaysService],
  controllers: [CommissionnementController],
  exports: [CommissionnementService],
})
export class CommissionnementModule {}
