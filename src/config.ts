// src/config.ts
import * as dotenv from 'dotenv';
dotenv.config();

export const Config = {
  AIRTABLE_API_KEY: process.env.AIRTABLE_API_KEY,
  AIRTABLE_BASE_ID: process.env.AIRTABLE_BASE_ID,
  JWT_SECRET: process.env.JWT_SECRET,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '465', 10),
  //SMTP_USER: process.env.SMTP_USER,
  //SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  SMTP_USER:'support@sourx.com',
  SMTP_PASSWORD:'%cT4D0AXT+!n',
};
// Logs pour vérifier les variables d'environnement
console.log('SMTP_HOST:', Config.SMTP_HOST);
console.log('SMTP_PORT:', Config.SMTP_PORT);
console.log('SMTP_USER:', Config.SMTP_USER);
console.log('SMTP_PASSWORD:', Config.SMTP_PASSWORD);

/*import * as dotenv from 'dotenv';
dotenv.config();

export const Config = {
  AIRTABLE_API_KEY: process.env.AIRTABLE_API_KEY,
  AIRTABLE_BASE_ID: process.env.AIRTABLE_BASE_ID,
  JWT_SECRET: process.env.JWT_SECRET,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '465', 10),
  SMTP_USER: 'support@sourx.com',
  SMTP_PASSWORD: '%cT4D0AXT+!n',
};

// Validation des variables d'environnement critiques
if (!Config.AIRTABLE_API_KEY) {
  throw new Error('AIRTABLE_API_KEY is not defined in the environment variables.');
}
if (!Config.AIRTABLE_BASE_ID) {
  throw new Error('AIRTABLE_BASE_ID is not defined in the environment variables.');
}
if (!Config.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in the environment variables.');
}
if (!Config.SMTP_HOST) {
  throw new Error('SMTP_HOST is not defined in the environment variables.');
}
if (!Config.SMTP_PORT) {
  throw new Error('SMTP_PORT is not defined in the environment variables.');
}

// Logs pour vérifier les variables d'environnement
console.log('AIRTABLE_API_KEY:', Config.AIRTABLE_API_KEY);
console.log('AIRTABLE_BASE_ID:', Config.AIRTABLE_BASE_ID);
console.log('JWT_SECRET:', Config.JWT_SECRET ? 'DEFINED' : 'NOT DEFINED');
console.log('SMTP_HOST:', Config.SMTP_HOST);
console.log('SMTP_PORT:', Config.SMTP_PORT);
console.log('SMTP_USER:', Config.SMTP_USER);
console.log('SMTP_PASSWORD:', Config.SMTP_PASSWORD ? 'DEFINED' : 'NOT DEFINED');*/