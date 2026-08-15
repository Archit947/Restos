import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import compression from 'compression';

import { config } from './config';
import { logger } from './config/logger';
import { testConnection } from './database/connection';
import { errorHandler, notFound } from './middleware/errorHandler';

// Route modules
import authRoutes from './modules/auth/auth.routes';
import restaurantRoutes from './modules/restaurants/restaurant.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import { publicRoutes } from './modules/public/public.routes';

// Simple inline routes for smaller modules
import { Router } from 'express';
import { authenticate } from './middleware/auth';
import { getAuditLogs } from './modules/audit-logs/auditLog.controller';
import { getNotifications, markAsRead, markAllAsRead } from './modules/notifications/notification.controller';
import { getSettings, updateSettings } from './modules/settings/settings.controller';

const app = express();

// ── Ensure upload directory exists ──────────────────────────────────────────
const uploadDir = path.join(__dirname, '..', config.storage.uploadDir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  logger.info(`Created upload directory: ${uploadDir}`);
}

// ── Security middleware ──────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: [config.platform.frontendUrl, 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Request processing ───────────────────────────────────────────────────────
app.use(compression() as any);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Logging ──────────────────────────────────────────────────────────────────
app.use(
  morgan(config.env === 'production' ? 'combined' : 'dev', {
    stream: { write: (msg: string) => logger.info(msg.trim()) },
  })
);

// ── Global rate limiting ─────────────────────────────────────────────────────
const globalRateLimit = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests' },
});
app.use('/api/', globalRateLimit);

// ── Static files (uploads) ───────────────────────────────────────────────────
app.use('/uploads', express.static(uploadDir));

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req: import('express').Request, res: import('express').Response) => {
  res.json({
    success: true,
    message: 'Restos API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    env: config.env,
  });
});

// ── API Routes ───────────────────────────────────────────────────────────────
const API_PREFIX = '/api/v1';

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/restaurants`, restaurantRoutes);
app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);
app.use(`${API_PREFIX}/public`, publicRoutes);

// Audit logs
const auditRouter = Router();
auditRouter.use(authenticate);
auditRouter.get('/', getAuditLogs);
app.use(`${API_PREFIX}/audit-logs`, auditRouter);

// Notifications
const notifRouter = Router();
notifRouter.use(authenticate);
notifRouter.get('/', getNotifications);
notifRouter.post('/read-all', markAllAsRead);
notifRouter.post('/:id/read', markAsRead);
app.use(`${API_PREFIX}/notifications`, notifRouter);

// Settings
const settingsRouter = Router();
settingsRouter.use(authenticate);
settingsRouter.get('/', getSettings);
settingsRouter.put('/', updateSettings);
app.use(`${API_PREFIX}/settings`, settingsRouter);

// Templates
import { templateRoutes } from './modules/templates/template.routes';
app.use(`${API_PREFIX}/templates`, templateRoutes);

// Restaurant Admin API
import { restaurantAuthRoutes } from './modules/restaurant-auth/restaurantAuth.routes';
import { restaurantAdminRoutes } from './modules/restaurant-admin/restaurantAdmin.routes';
app.use(`${API_PREFIX}/restaurant-auth`, restaurantAuthRoutes);
app.use(`${API_PREFIX}/restaurant-admin`, restaurantAdminRoutes);

// ── Error handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Bootstrap ────────────────────────────────────────────────────────────────
async function bootstrap(): Promise<void> {
  await testConnection();

  app.listen(config.port, () => {
    logger.info(`🚀 Restos API running on port ${config.port}`);
    logger.info(`📍 Environment: ${config.env}`);
    logger.info(`🌐 Frontend URL: ${config.platform.frontendUrl}`);
    logger.info(`🔑 Admin: ${config.admin.email}`);
  });
}

bootstrap().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
