'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');

const env = require('./config/env');
const logger = require('./utils/logger');
const { generalLimiter } = require('./middleware/rateLimiter.middleware');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler.middleware');

// Route imports — Super Admin
const authRoutes         = require('./modules/auth/auth.routes');
const dashboardRoutes    = require('./modules/dashboard/dashboard.routes');
const restaurantRoutes   = require('./modules/restaurants/restaurant.routes');
const templateRoutes     = require('./modules/templates/template.routes');
const websiteRoutes      = require('./modules/websites/website.routes');
const auditRoutes        = require('./modules/audit/audit.routes');
const notificationRoutes = require('./modules/notifications/notification.routes');
const settingsRoutes     = require('./modules/settings/settings.routes');

// Route imports — Restaurant Admin
const rAuthRoutes      = require('./modules/restaurant-auth/auth.routes');
const rDashboardRoutes = require('./modules/restaurant-admin/dashboard.routes');
const rMenuRoutes      = require('./modules/restaurant-admin/menu.routes');
const rCmsRoutes       = require('./modules/restaurant-admin/cms.routes');
const rOrdersRoutes    = require('./modules/restaurant-admin/orders.routes');
const rStaffRoutes     = require('./modules/restaurant-admin/staff.routes');
const rTablesRoutes    = require('./modules/restaurant-admin/tables.routes');

// Route imports — Kitchen KDS
const kdsRoutes = require('./modules/kds/kds.routes');

// Route imports — Store Portal
const storeAuthRoutes      = require('./modules/store-auth/auth.routes');
const storeDashboardRoutes = require('./modules/store-admin/dashboard.routes');
const storeItemsRoutes     = require('./modules/store-admin/items.routes');
const storeOrdersRoutes    = require('./modules/store-admin/orders.routes');

// Route imports — Public Website
const publicRoutes    = require('./modules/public/public.routes');

// Route imports — Affiliate Ads
const affiliateRoutes = require('./modules/affiliate/affiliate.routes');

const app = express();

// ============================================================
// Security Middleware
// ============================================================
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false, // Configured separately for fine-grained control
}));

// CORS
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || env.CORS.ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
app.use(cors(corsOptions));
// Explicitly handle OPTIONS preflight for all routes
app.options('*', cors(corsOptions));

// ============================================================
// General Middleware
// ============================================================
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logging (only in development)
if (env.IS_DEVELOPMENT) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) },
  }));
}

// Rate limiting
app.use(`/api/${env.API_VERSION}`, generalLimiter);

// ============================================================
// Static Files (uploads)
// ============================================================
app.use('/uploads', express.static(path.resolve(env.UPLOAD.PATH)));

// ============================================================
// Health Check
// ============================================================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    platform: env.PLATFORM.NAME,
    version: env.API_VERSION,
    env: env.NODE_ENV,
  });
});

// ============================================================
// API Routes
// ============================================================
const apiBase = `/api/${env.API_VERSION}`;

// ── Super Admin routes ──
app.use(`${apiBase}/auth`, authRoutes);
app.use(`${apiBase}/dashboard`, dashboardRoutes);
app.use(`${apiBase}/restaurants`, restaurantRoutes);
app.use(`${apiBase}/templates`, templateRoutes);
app.use(`${apiBase}/websites`, websiteRoutes);
app.use(`${apiBase}/audit-logs`, auditRoutes);
app.use(`${apiBase}/notifications`, notificationRoutes);
app.use(`${apiBase}/settings`, settingsRoutes);

// ── Public Website routes (no auth) ──
app.use(`${apiBase}/public`, publicRoutes);

// ── Affiliate Ads (admin + public sub-routes inside the module) ──
app.use(`${apiBase}/affiliate`, affiliateRoutes);

// ── Restaurant Admin routes ──
app.use(`${apiBase}/restaurant/auth`,      rAuthRoutes);
app.use(`${apiBase}/restaurant/dashboard`, rDashboardRoutes);
app.use(`${apiBase}/restaurant/menu`,      rMenuRoutes);
app.use(`${apiBase}/restaurant/cms`,       rCmsRoutes);
app.use(`${apiBase}/restaurant/orders`,    rOrdersRoutes);
app.use(`${apiBase}/restaurant/staff`,     rStaffRoutes);
app.use(`${apiBase}/restaurant/tables`,    rTablesRoutes);

// ── Kitchen KDS routes ──
app.use(`${apiBase}/kds`, kdsRoutes);

// ── Store Portal routes ──
app.use(`${apiBase}/store/auth`,      storeAuthRoutes);
app.use(`${apiBase}/store/dashboard`, storeDashboardRoutes);
app.use(`${apiBase}/store/items`,     storeItemsRoutes);
app.use(`${apiBase}/store/orders`,    storeOrdersRoutes);

// ============================================================
// Error Handlers (must be last)
// ============================================================
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
