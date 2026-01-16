import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { MailModule } from './mail/mail.module';
import { AuthModule } from './auth/auth.module';
import { PaysModule } from './pays/pays.module';
import { GrilleTarifaireModule } from './grille-tarifaire/grille-tarifaire.module';
import { CompteSystemeModule } from './compte-systeme/compte-systeme.module';
import { CommissionnementModule } from './commissionnement/commissionnement.module';
import { CodesRechargeModule } from './codes-recharge/codes-recharge.module';
import { TransactionsModule } from './transactions/transactions.module';
import { AgripayModule } from './agripay/agripay.module';

@Module({
  imports: [UsersModule, MailModule, AuthModule, PaysModule, GrilleTarifaireModule, CompteSystemeModule, CommissionnementModule, CodesRechargeModule, TransactionsModule, AgripayModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
