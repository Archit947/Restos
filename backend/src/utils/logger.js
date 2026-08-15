'use strict';

const winston = require('winston');
const path = require('path');
const env = require('../config/env');

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

// Custom log format for console
const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const logger = winston.createLogger({
  level: env.LOG.LEVEL,
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    json()
  ),
  transports: [
    // Console transport (colorized)
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        consoleFormat
      ),
    }),
    // File transport - combined log
    new winston.transports.File({
      filename: path.resolve(env.LOG.FILE),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true,
    }),
    // File transport - error only
    new winston.transports.File({
      filename: path.resolve(env.LOG.FILE.replace('.log', '.error.log')),
      level: 'error',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    }),
  ],
  exitOnError: false,
});

module.exports = logger;
