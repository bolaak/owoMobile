// src/transactions/transactions.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { CodesRechargeModule } from '../codes-recharge/codes-recharge.module'; // Chemin correct vers CodesRechargeModule
import { UsersModule } from '../users/users.module'; // Chemin correct vers UsersModule
import { GrilleTarifaireModule } from '../grille-tarifaire/grille-tarifaire.module'; // Chemin correct vers GrilleTarifaireModule


@Module({
  imports: [CodesRechargeModule, forwardRef(() => UsersModule), forwardRef(() => GrilleTarifaireModule),],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService], // Exporter le service
  
})
export class TransactionsModule {}
