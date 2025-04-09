import { Module } from '@nestjs/common';
import { CommissionnementService } from './commissionnement.service';
import { CommissionnementController } from './commissionnement.controller';
//import { UsersModule } from '../users/users.module'; // Chemin correct vers UsersModule


@Module({
  //imports: [forwardRef(() => UsersModule),], // UsersModule
  providers: [CommissionnementService],
  controllers: [CommissionnementController],
  exports: [CommissionnementService],
})
export class CommissionnementModule {}
