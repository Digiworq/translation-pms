# 🌐 LingoTech PMS - Translation & Localization Project Management System

LingoTech PMS is an enterprise-grade Project Management System engineered specifically for Translation & Localization agencies. It features role-based access control, automated project metrics, dual database sync (MySQL & MongoDB), client billing, vendor payouts, and interactive visual dashboards.

---

## 📁 Repository Structure

```text
translation-pms/
├── frontend/                 # React (Vite) + Tailwind CSS UI
├── backend/                  # Node.js + Express REST API
│   ├── src/controllers/     # Business logic & MySQL controllers
│   ├── prisma/               # Prisma Schema & Database Models
│   └── src/server.js         # Server entry point
├── lingotech_pms.sql         # Full Standalone MySQL Database Dump File
├── DATABASE_SETUP_GUIDE.md   # Step-by-Step Database Import & Setup Guide
├── vercel.json               # Vercel Deployment Configuration
└── push_to_github.bat        # Automated GitHub Push Script
```

---

## ⚡ Quick Start (Local Setup)

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Configure Database & Environment
Open `backend/.env` (or copy from `backend/.env.example`) and set your database connection:
```env
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/lingotech_pms"
PORT=5000
```

### 3. Initialize Database
```bash
npm run prisma:migrate
npm run seed:mysql
```

*(For detailed alternative database import options, see [DATABASE_SETUP_GUIDE.md](DATABASE_SETUP_GUIDE.md)).*

### 4. Run Development Server
```bash
npm run dev
```
Open **`http://localhost:5173`** in your browser!

---

## 🗄️ Database Setup Instructions

For clients or developers importing the database into a fresh MySQL installation, please refer to the comprehensive guide in **[DATABASE_SETUP_GUIDE.md](DATABASE_SETUP_GUIDE.md)**:

- **Method 1**: Automated Prisma Migration & Seed (`npm run prisma:migrate && npm run seed:mysql`)
- **Method 2**: MySQL Command Line Import (`mysql -u root -p lingotech_pms < lingotech_pms.sql`)
- **Method 3**: MySQL Workbench GUI Import

---

## 🚀 Deployment to Vercel

This repository is pre-configured for 1-click deployment on **Vercel**:

1. Push this repository to your GitHub account using `push_to_github.bat`.
2. Go to **[Vercel.com](https://vercel.com)** and click **"Add New Project"**.
3. Select this repository (`translation-pms`).
4. In Project Settings -> **Environment Variables**, set:
   ```env
   DATABASE_URL="mysql://user:password@your-cloud-db-host:3306/lingotech_pms"
   ```
5. Click **Deploy**!

---

## 🔒 Default Super Admin Credentials

- **Role**: Executive Super Admin
- **Email**: `admin@pms.com`
- **Permissions**: Full system management (Create/Edit Projects, Clients, Vendors, Delete Controls).

---

## 📜 License
Privately owned software for Enterprise Translation & Localization Management.
