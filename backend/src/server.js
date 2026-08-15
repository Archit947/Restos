'use strict';

const app = require('./app');
const env = require('./config/env');
const logger = require('./utils/logger');
const { testConnection } = require('./config/database');
const { ensureDir } = require('./utils/storageHelper');
const path = require('path');

const PORT = env.PORT;

async function startServer() {
  // Test database connectivity first
  const dbConnected = await testConnection();
  if (!dbConnected) {
    logger.error('❌ Cannot connect to database. Ensure MySQL is running and .env is configured correctly.');
    process.exit(1);
  }

  // Ensure upload directories exist
  const uploadDirs = ['logos', 'covers', 'restaurants', 'templates', 'media'];
  uploadDirs.forEach(dir => {
    ensureDir(path.resolve(env.UPLOAD.PATH, dir));
  });
  ensureDir(path.resolve('./logs'));

  const server = app.listen(PORT, () => {
    logger.info('==================================================');
    logger.info(`🚀 ${env.PLATFORM.NAME} API Server started`);
    logger.info(`   Environment : ${env.NODE_ENV}`);
    logger.info(`   Port        : ${PORT}`);
    logger.info(`   API Base    : http://localhost:${PORT}/api/${env.API_VERSION}`);
    logger.info(`   Health      : http://localhost:${PORT}/health`);
    logger.info('==================================================');
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      logger.info('Server closed.');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received. Shutting down gracefully...');
    server.close(() => {
      logger.info('Server closed.');
      process.exit(0);
    });
  });

  // Unhandled rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });

  return server;
}

startServer();
