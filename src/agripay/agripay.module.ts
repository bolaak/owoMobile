// src/transactions/transactions.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { AgripayController } from './agripay.controller';
import { AgripayService } from './agripay.service';
import { UsersModule } from '../users/users.module'; // Chemin correct vers UsersModule
import { TransactionsModule } from '../transactions/transactions.module'; 
import { OTPModule } from '../otp/otp.module';

@Module({
  imports: [forwardRef(() => TransactionsModule),forwardRef(() => UsersModule),forwardRef(() => OTPModule),],
  controllers: [AgripayController],
  providers: [AgripayService],
  exports: [AgripayService], // Exporter le service
  
})
export class AgripayModule {}
