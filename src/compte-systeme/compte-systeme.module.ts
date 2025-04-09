import { Module } from '@nestjs/common';
import { CompteSystemeService } from './compte-systeme.service';
import { CompteSystemeController } from './compte-systeme.controller';

@Module({
  providers: [CompteSystemeService],
  controllers: [CompteSystemeController],
  exports: [CompteSystemeService],

})
export class CompteSystemeModule {}
