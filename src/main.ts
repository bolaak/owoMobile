/*import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';



// Chargez les variables d'environnement
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*', // Autorise toutes les origines (à ajuster en production)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'PATCH'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Appliquez le filtre d'exception globalement
  app.useGlobalFilters(new AllExceptionsFilter());

  //await app.listen(process.env.PORT ?? 3000);
  const port = process.env.PORT || 3003;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}
bootstrap();*/

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import helmet from 'helmet';

// Chargez les variables d'environnement
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Utiliser Helmet pour les headers de sécurité
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Peut être ajusté selon vos besoins
  }));

  // Configuration CORS
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://owomobile-1c888c91ddc9.herokuapp.com'] 
      : ['http://localhost:3000', 'http://localhost:4200'], // Domaines spécifiques en dev
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'PATCH'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Appliquez le filtre d'exception globalement
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.PORT || 3003;
  await app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

bootstrap();
