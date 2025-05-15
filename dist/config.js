"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = void 0;
const dotenv = require("dotenv");
dotenv.config();
exports.Config = {
    AIRTABLE_API_KEY: process.env.AIRTABLE_API_KEY,
    AIRTABLE_BASE_ID: process.env.AIRTABLE_BASE_ID,
    JWT_SECRET: process.env.JWT_SECRET,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: parseInt(process.env.SMTP_PORT || '465', 10),
    SMTP_USER: 'support@sourx.com',
    SMTP_PASSWORD: '%cT4D0AXT+!n',
};
console.log('SMTP_HOST:', exports.Config.SMTP_HOST);
console.log('SMTP_PORT:', exports.Config.SMTP_PORT);
console.log('SMTP_USER:', exports.Config.SMTP_USER);
console.log('SMTP_PASSWORD:', exports.Config.SMTP_PASSWORD);
//# sourceMappingURL=config.js.map