# LingoTech PMS — Enterprise Translation & Localization Operations Platform

A full-stack, enterprise-grade Translation Management System (PMS) built with React, Node.js/Express, Prisma ORM, and MySQL.

---

## 🏗️ Production Architecture

```text
USERS (Browser)
   │
   ▼ HTTPS
┌─────────────────────────────────┐
│ React Frontend                  │
│ (Hosted on Vercel)              │
│ https://translation-pms.vercel  │
└────────────────┬────────────────┘
                 │ HTTPS API Calls (VITE_API_URL)
                 ▼
┌─────────────────────────────────┐
│ Production Express Backend      │
│ (Hosted on Render / Railway)    │
│ https://pms-api.onrender.com    │
└────────────────┬────────────────┘
                 │ Prisma ORM
                 ▼
┌─────────────────────────────────┐
│ Managed MySQL Database          │
│ (Hosted on Railway / Aiven)     │
└─────────────────────────────────┘
```

---

## 🚀 Step-by-Step Production Deployment Guide

### STEP 1: Deploy Hosted MySQL Database (Railway / Aiven / Managed MySQL)

1. Sign up for a free account on **[Railway.app](https://railway.app)** or **[Render.com](https://render.com)**.
2. Click **New Project** -> Select **Provision MySQL**.
3. Railway creates your live MySQL database in 5 seconds and gives you a connection string:
   `mysql://root:password@host:3306/railway`
4. Copy your `MYSQL_URL` connection string.

---

### STEP 2: Import Database Schema & Seed Data

Run Prisma migrations or import `lingotech_pms.sql` to initialize all 16 MySQL tables:

```bash
# Set your production database URL
export DATABASE_URL="mysql://root:password@host:3306/railway"

# Run Prisma migrations & seed initial admin accounts
npx prisma db push
npx prisma db seed
```

*(Alternatively, import `lingotech_pms.sql` directly via phpMyAdmin or MySQL CLI).*

---

### STEP 3: Deploy Backend API (Render.com / Railway.app)

1. Create a new **Web Service** on Render.com or Railway.app linked to your GitHub repo (`Digiworq/translation-pms`).
2. Set **Root Directory**: `backend`
3. Set **Build Command**: `npm install && npx prisma generate`
4. Set **Start Command**: `node src/server.js`
5. Add Environment Variables:
   - `DATABASE_URL` = `mysql://root:password@host:3306/railway`
   - `NODE_ENV` = `production`
   - `CLIENT_URL` = `https://translation-pms-five.vercel.app`
   - `JWT_SECRET` = `your_secure_production_jwt_secret_key`
6. Click **Deploy**!
7. Copy your live backend API URL (e.g. `https://translation-pms-api.onrender.com`).

---

### STEP 4: Connect Vercel Frontend to Production Backend

1. Go to your **[Vercel Dashboard](https://vercel.com)** -> Select your `translation-pms` project.
2. Navigate to **Settings** -> **Environment Variables**.
3. Add a new variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://translation-pms-api.onrender.com/api`
   - Select **Production**, **Preview**, and **Development**.
4. Click **Save** and trigger a **Redeploy** on Vercel.

---

## 🔍 Verification & Health Check

1. Verify backend health endpoint:
   ```http
   GET https://translation-pms-api.onrender.com/api/health
   ```
   Response:
   ```json
   {
     "success": true,
     "message": "PMS backend is running"
   }
   ```

2. Open your live Vercel application:
   **`https://translation-pms-five.vercel.app`**

3. Test logging in, managing projects, clients, vendors, and invoices — **the application runs 24/7 independently without requiring your personal computer!**

---

## 💻 Local Development Setup

### 1. Backend Setup
```bash
cd backend
npm install
npx prisma generate
npm start
```
Backend runs locally at `http://localhost:5000/api`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs locally at `http://localhost:5173`.
