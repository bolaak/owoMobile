import { Module } from '@nestjs/common';
import { CodesRechargeService } from './codes-recharge.service';
import { CodesRechargeController } from './codes-recharge.controller';
import { GCSService } from '../google_cloud/gcs.service'; // Importez le service GCS


@Module({
  providers: [CodesRechargeService, GCSService],
  controllers: [CodesRechargeController],
  exports: [CodesRechargeService], // Exporter le service pour qu'il soit accessible dans d'autres modules

})
export class CodesRechargeModule {}
