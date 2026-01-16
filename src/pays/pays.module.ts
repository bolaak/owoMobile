import { Module } from '@nestjs/common';
import { PaysService } from './pays.service';
import { PaysController } from './pays.controller';

@Module({
  providers: [PaysService],
  controllers: [PaysController]
})
export class PaysModule {}
