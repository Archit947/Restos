'use strict';

const path = require('path');
// Always load .env from the backend root regardless of process.cwd()
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  API_VERSION: process.env.API_VERSION || 'v1',

  // Supabase / PostgreSQL connection string (takes precedence over individual vars)
  DATABASE_URL: process.env.DATABASE_URL || null,

  SUPABASE: {
    URL:         process.env.SUPABASE_URL         || '',
    SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || '',
    BUCKET:      process.env.SUPABASE_BUCKET      || 'restos-uploads',
  },

  DB: {
    HOST: process.env.DB_HOST || 'localhost',
    PORT: parseInt(process.env.DB_PORT, 10) || 5432,
    USER: process.env.DB_USER || 'postgres',
    PASSWORD: process.env.DB_PASSWORD || '',
    NAME: process.env.DB_NAME || 'postgres',
    POOL_MIN: parseInt(process.env.DB_POOL_MIN, 10) || 2,
    POOL_MAX: parseInt(process.env.DB_POOL_MAX, 10) || 10,
  },

  JWT: {
    ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'restos_access_secret_change_me',
    REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'restos_refresh_secret_change_me',
    ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '15m',
    REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  PLATFORM: {
    NAME: process.env.PLATFORM_NAME || 'Restos',
    DOMAIN: process.env.PLATFORM_DOMAIN || 'restos.com',
    URL: process.env.PLATFORM_URL || 'http://localhost:5000',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
    SUBDOMAIN_SUFFIX: process.env.SUBDOMAIN_SUFFIX || '.restos.com',
    SITE_BASE_URL: process.env.SITE_BASE_URL || null, // e.g. http://localhost:5173/site  (dev only)
  },

  CORS: {
    ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173').split(','),
  },

  UPLOAD: {
    PATH: process.env.UPLOAD_PATH || './uploads',
    MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 10,
    BASE_URL: process.env.STORAGE_BASE_URL || 'http://localhost:5000/uploads',
  },

  SMTP: {
    HOST: process.env.SMTP_HOST || '',
    PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
    SECURE: process.env.SMTP_SECURE === 'true',
    USER: process.env.SMTP_USER || '',
    PASS: process.env.SMTP_PASS || '',
    FROM_NAME: process.env.SMTP_FROM_NAME || 'Restos Platform',
    FROM_EMAIL: process.env.SMTP_FROM_EMAIL || 'noreply@restos.com',
  },

  RATE_LIMIT: {
    WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    MAX: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  },

  LOG: {
    LEVEL: process.env.LOG_LEVEL || 'info',
    FILE: process.env.LOG_FILE || './logs/app.log',
  },

  SECURITY: {
    BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
    PASSWORD_RESET_EXPIRES_HOURS: parseInt(process.env.PASSWORD_RESET_EXPIRES_HOURS, 10) || 2,
  },

  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
};

module.exports = env;
