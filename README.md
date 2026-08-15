# 🍽️ Restos — Multi-Tenant Restaurant SaaS Platform

> **Enterprise-grade Super Admin Panel** for managing a multi-tenant restaurant SaaS platform.  
> Built with React + TypeScript + Tailwind CSS (frontend) and Node.js + Express + MySQL (backend).

---

## 🏗️ Architecture

```
restos.com (Platform)
└── admin panel (Super Admin)          → Manage all restaurants
└── /restaurant/login                  → Restaurant owner login
└── biriyanihouse.restos.com           → Auto-generated restaurant website
└── palacerestaurant.restos.com        → Another restaurant website
```

Each restaurant gets:
- ✅ Isolated tenant workspace (UUID-based)
- ✅ Unique subdomain (e.g., `biriyanihouse.restos.com`)
- ✅ Login credentials (restaurant_uid + username + password)
- ✅ Full website with 10 default CMS pages
- ✅ Independent database records
- ✅ Subscription plan with feature gates

---

## 📁 Project Structure

```
Restos/
├── backend/                      # Node.js + Express API
│   ├── src/
│   │   ├── app.js                # Express app setup
│   │   ├── server.js             # Server entry point
│   │   ├── config/               # DB, env, constants
│   │   ├── middleware/           # Auth, RBAC, rate limit, audit
│   │   ├── modules/              # Feature modules
│   │   │   ├── auth/             # JWT authentication
│   │   │   ├── dashboard/        # Analytics & stats
│   │   │   ├── restaurants/      # Full CRUD + onboarding
│   │   │   ├── tenants/          # Auto tenant creation
│   │   │   ├── websites/         # Website management
│   │   │   ├── templates/        # Template engine
│   │   │   ├── cms/              # CMS management
│   │   │   ├── audit/            # Audit logs
│   │   │   ├── settings/         # Platform settings
│   │   │   └── notifications/    # Admin notifications
│   │   └── utils/                # Helpers
│   ├── database/
│   │   ├── schema.sql            # Complete MySQL schema (23 tables)
│   │   └── seed.sql              # Default data
│   ├── uploads/                  # File storage
│   ├── logs/                     # Application logs
│   └── .env                      # Configuration
│
└── frontend/                     # React + TypeScript + Tailwind
    ├── src/
    │   ├── api/                  # Axios API clients
    │   ├── components/
    │   │   ├── layout/           # Sidebar, Header, Layout
    │   │   └── common/           # Reusable UI components
    │   ├── features/
    │   │   ├── auth/             # Login page
    │   │   ├── dashboard/        # Stats + charts
    │   │   ├── restaurants/      # List + 5-step wizard
    │   │   ├── websites/         # Website management
    │   │   ├── templates/        # Template management
    │   │   ├── audit/            # Audit logs
    │   │   └── settings/         # Platform settings
    │   ├── store/                # Zustand state
    │   └── types/                # TypeScript types
    └── .env
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8.0+ (running via MySQL Workbench)
- npm

---

### 1. Database Setup

Open **MySQL Workbench**, connect to your local server, and run:

```bash
# From the project root
cd backend
npm install
```

Then configure your database credentials in `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=restos_platform
```

Run the automated setup script:

```bash
cd backend
node src/scripts/setup.js
```

This will:
- ✅ Create the `restos_platform` database
- ✅ Create all 23 tables
- ✅ Seed default data (plans, templates, settings)
- ✅ Create the Super Admin account

---

### 2. Start Backend

```bash
cd backend
npm run dev
```

Backend runs at: `http://localhost:5000`  
Health check: `http://localhost:5000/health`

---

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:3000`

---

### 4. Login

| Field    | Value              |
|----------|--------------------|
| URL      | http://localhost:3000/login |
| Email    | admin@restos.com   |
| Password | Admin@123          |

---

## 🔐 API Endpoints

### Authentication
```
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh-token
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
GET    /api/v1/auth/me
PUT    /api/v1/auth/me
PUT    /api/v1/auth/change-password
```

### Restaurants
```
GET    /api/v1/restaurants            List with filters & pagination
POST   /api/v1/restaurants            Create + auto tenant setup
GET    /api/v1/restaurants/:id        Get full details
PUT    /api/v1/restaurants/:id        Update
PATCH  /api/v1/restaurants/:id/status Change status
DELETE /api/v1/restaurants/:id        Soft delete
POST   /api/v1/restaurants/:id/reset-password  Reset credentials
PATCH  /api/v1/restaurants/:id/plan   Change plan
POST   /api/v1/restaurants/bulk       Bulk actions
GET    /api/v1/restaurants/check-subdomain     Availability check
```

### Dashboard
```
GET    /api/v1/dashboard/stats
GET    /api/v1/dashboard/charts
GET    /api/v1/dashboard/recent-activity
GET    /api/v1/dashboard/expiring-subscriptions
GET    /api/v1/dashboard/top-restaurants
```

### Other Modules
```
GET    /api/v1/websites
GET    /api/v1/templates
GET    /api/v1/audit-logs
GET    /api/v1/notifications
GET    /api/v1/settings
PUT    /api/v1/settings
```

---

## 🗄️ Database Schema

23 tables covering:

| Table | Purpose |
|-------|---------|
| `super_admins` | Admin users with RBAC |
| `tenants` | Tenant isolation (UUID-based) |
| `restaurants` | Restaurant records |
| `restaurant_addresses` | Location data |
| `restaurant_credentials` | Login credentials |
| `restaurant_subscriptions` | Plan subscriptions |
| `subscription_plans` | Available plans |
| `websites` | Restaurant websites |
| `website_templates` | Template engine |
| `cms_pages` | Page-based CMS |
| `cms_settings` | Business info settings |
| `media_library` | File/media storage |
| `subdomains` | Subdomain management |
| `blog_posts` | Blog/articles |
| `events` | Event management |
| `reservations` | Table reservations |
| `affiliate_products` | Affiliate listings |
| `marketing_banners` | Promotional banners |
| `navigation_menus` | Website navigation |
| `audit_logs` | Complete action history |
| `notifications` | Admin notifications |
| `platform_settings` | Global config |
| `refresh_tokens` | JWT token management |

---

## 🔒 Security Features

- ✅ JWT + Refresh Token rotation
- ✅ Role-Based Access Control (RBAC): super_admin / admin / support
- ✅ Bcrypt password hashing (12 rounds)
- ✅ Rate limiting (general + strict auth)
- ✅ Tenant isolation (UUID-based)
- ✅ Input validation
- ✅ CORS protection
- ✅ Helmet.js security headers
- ✅ SQL injection protection (parameterized queries)
- ✅ Audit log for all actions
- ✅ Reserved subdomain protection

---

## 🌟 Key Features

### 5-Step Restaurant Wizard
1. **Restaurant Info** — Name, owner, contact, cuisine, images
2. **Address** — Location with lat/long for Google Maps
3. **Website** — Auto subdomain generation with live availability check
4. **Subscription** — Plan selection with feature toggles
5. **Credentials** — Auto-generated, copy-ready login details

### Auto Tenant Creation
When a restaurant is created, the platform automatically:
- Generates a UUID tenant ID
- Creates subdomain (e.g., `biriyanihouse.restos.com`)
- Creates website record
- Creates 10 default CMS pages
- Sets up CMS settings and navigation
- Generates secure login credentials

### Dashboard Analytics
- Restaurant counts by status
- Growth charts (12-month line chart)
- Status distribution (doughnut chart)
- Real-time activity feed
- Expiring subscription alerts

---

## 🛣️ Future Roadmap

- [ ] AWS S3 storage integration (abstraction layer ready)
- [ ] Custom domain support
- [ ] SSL automation
- [ ] Email notifications via SMTP
- [ ] Restaurant portal (restaurant-side dashboard)
- [ ] Payment integration (Stripe/Razorpay)
- [ ] Advanced analytics
- [ ] Two-factor authentication
- [ ] Multi-language support

---

## 👨‍💻 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS 3.x |
| State | Zustand + React Query |
| Charts | Chart.js + react-chartjs-2 |
| Backend | Node.js + Express.js |
| Database | MySQL 8.0 |
| Auth | JWT + bcrypt |
| Logging | Winston |
| Validation | express-validator |

---

*Restos Platform — Production-ready, scalable, multi-tenant Restaurant SaaS.*
