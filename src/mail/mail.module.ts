// src/mail/mail.module.ts
import { Module } from '@nestjs/common';
import { MailService } from './mail.service';

@Module({
  providers: [MailService],
  exports: [MailService], // Exportez le service pour qu'il soit utilisable dans d'autres modules
})
export class MailModule {}