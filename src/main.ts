import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';



// Chargez les variables d'environnement
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Appliquez le filtre d'exception globalement
  app.useGlobalFilters(new AllExceptionsFilter());

  //await app.listen(process.env.PORT ?? 3000);
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}
bootstrap();
