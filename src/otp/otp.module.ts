// src/transactions/transactions.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { OTPService } from './otp.service';
import { UsersModule } from '../users/users.module'; // Chemin correct vers UsersModule
import { TransactionsModule } from '../transactions/transactions.module'; 


@Module({
  imports: [forwardRef(() => TransactionsModule),forwardRef(() => UsersModule),],
  //controllers: [OTPService],
  providers: [OTPService],
  exports: [OTPService], // Exporter le service
  
})
export class OTPModule {}
