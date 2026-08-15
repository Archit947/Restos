# Restos — Deployment Guide
## Supabase (DB) + Vercel (Frontend) + Render (Backend)

---

## 1. Set Up Supabase Database

1. Go to [supabase.com](https://supabase.com) → New Project
2. Choose a region close to your users (e.g., `ap-south-1` for India)
3. Set a strong database password (save it!)
4. Once created, open **SQL Editor** and paste the full contents of:
   ```
   backend/database/supabase_schema.sql
   ```
5. Click **Run** — all tables and seed data will be created
6. Go to **Settings → Database → Connection string (URI)**
   - Copy the URI (looks like `postgresql://postgres:[PASSWORD]@db.[ID].supabase.co:5432/postgres`)
   - Replace `[YOUR-PASSWORD]` in the URI with your actual password

---

## 2. Deploy Backend to Render

> Render supports long-running Express servers and persistent filesystem for file uploads.
> Vercel's serverless functions don't support this well for Express + multer.

1. Go to [render.com](https://render.com) → New Web Service
2. Connect your GitHub repo, choose the `backend/` folder (or set root directory)
3. **Build command:** `npm install`
4. **Start command:** `npm start`
5. **Environment:** Node
6. Add these environment variables:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `postgresql://postgres:[PASSWORD]@db.[ID].supabase.co:5432/postgres` |
| `JWT_ACCESS_SECRET` | (random 32+ char string) |
| `JWT_REFRESH_SECRET` | (random 32+ char string) |
| `FRONTEND_URL` | `https://your-app.vercel.app` |
| `ALLOWED_ORIGINS` | `https://your-app.vercel.app` |
| `PLATFORM_URL` | `https://your-backend.onrender.com` |
| `STORAGE_BASE_URL` | `https://your-backend.onrender.com/uploads` |

7. After deploy, note your Render URL (e.g., `https://restos-backend.onrender.com`)

---

## 3. Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo, set **Root Directory** to `frontend/`
3. **Framework Preset:** Vite
4. **Build command:** `npm run build` (auto-detected)
5. **Output directory:** `dist` (auto-detected)
6. Add environment variable:

| Key | Value |
|-----|-------|
| `VITE_API_BASE_URL` | `https://your-backend.onrender.com/api/v1` |

7. Deploy — Vercel auto-handles SPA routing via `frontend/vercel.json`

---

## 4. First-Time Setup After Deploy

1. Visit your Vercel URL → click **Login**
2. Super admin credentials:
   - **Email:** `admin@restos.com`
   - **Password:** `Admin@123`
3. **Change the password immediately** after first login

---

## 5. Local Development

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your Supabase DATABASE_URL
npm install
npm run dev

# Frontend (new terminal)
cd frontend
cp .env.example .env
# Edit .env: VITE_API_BASE_URL=http://localhost:5000/api/v1
npm install
npm run dev
```

---

## Notes

- **File uploads** (menu images, logos) are stored on Render's filesystem under `uploads/`.
  Render's free tier has ephemeral storage — files may be lost on redeploy.
  For permanent storage, integrate [Supabase Storage](https://supabase.com/storage) or AWS S3.

- **Free tier limits:**
  - Render free: sleeps after 15 min inactivity (first request is slow)
  - Supabase free: 500 MB database, 1 GB file storage
  - Vercel free: unlimited static hosting

- **Upgrade path:**
  - Render Starter ($7/mo): no sleep, 512 MB RAM
  - Supabase Pro ($25/mo): daily backups, more storage
