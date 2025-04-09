import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MailModule } from '../mail/mail.module'; 
import { TransactionsModule } from '../transactions/transactions.module';
import { GrilleTarifaireModule } from '../grille-tarifaire/grille-tarifaire.module'; // Chemin correct vers GrilleTarifaireModule
import { CompteSystemeModule } from '../compte-systeme/compte-systeme.module'; // Chemin correct vers CompteSystemeModule
import { CommissionnementModule } from '../commissionnement/commissionnement.module'; // Chemin correct vers CommissionnementModule




@Module({
  imports: [MailModule, forwardRef(() => TransactionsModule), forwardRef(() => GrilleTarifaireModule), forwardRef(() => CompteSystemeModule), forwardRef(() => CommissionnementModule),], // Ajoutez MailModule ici
  providers: [UsersService], //TransactionsService 
  controllers: [UsersController],
  exports: [UsersService], // Exporter le service

})
export class UsersModule {}
