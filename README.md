# LingoTech PMS — Full-Stack Translation & Localization Project Management System

A production-grade, highly secure, full-stack **Project Management System (PMS)** custom-built for professional Translation & Localization agencies. Built with **React, Vite, Node.js, Express.js, Prisma ORM, and MySQL**.

---

## 📖 Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    React + Vite Frontend                    │
│   (Tailwind CSS, Lucide Icons, Recharts, Axios, React Router)│
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / REST API (JWT Cookie)
┌──────────────────────────────▼──────────────────────────────┐
│                    Node.js / Express Backend                │
│   (Auth, RBAC Middleware, Rate Limiting, Audit Logger)      │
└──────────────────────────────┬──────────────────────────────┘
                               │ Prisma ORM
┌──────────────────────────────▼──────────────────────────────┐
│                        MySQL Database                       │
│  (Users, Roles, Clients, Vendors, Projects, Files, Invoices) │
└─────────────────────────────────────────────────────────────┘
```

> **Security Guarantee**: React never communicates directly with MySQL. All database access passes through Express REST controllers with role-based validation and resource authorization.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Recharts, Axios, React Router v6.
- **Backend**: Node.js, Express.js, JWT (`jsonwebtoken`), bcrypt password hashing, `cookie-parser`, `cors`, `helmet`, `express-rate-limit`, `multer`.
- **Database & ORM**: MySQL 8.0+, Prisma ORM (`@prisma/client`, `prisma`).

---

## 🚀 Quick Setup & Installation Guide

### Prerequisites
- Node.js v18.0+
- MySQL Server 8.0+ running locally on port `3306`

### 1. Database & Backend Configuration

You can navigate into the subdirectories or run convenience commands from the root folder:

#### Option A: Running from Subdirectories
```bash
# Backend Setup
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev

# Frontend Setup (in a second terminal)
cd frontend
npm install
npm run dev
```

#### Option B: Running from Root Directory (`translation-pms`)
```bash
npm run install:all      # Installs backend & frontend dependencies
npm run prisma:generate  # Generates Prisma client
npm run prisma:migrate   # Migrates database
npm run prisma:seed      # Seeds demo accounts and data
npm run dev:backend      # Launches Backend on http://localhost:5000
npm run dev:frontend     # Launches Frontend on http://localhost:5173
```

---

## 🔑 Pre-Configured Demo Credentials

Use these pre-seeded accounts to test different Role-Based Access Control (RBAC) levels:

| Role | Email | Password | Scope & Permissions |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@pms.com` | `Admin@123456` | Full system control, audit logs, user admin, settings |
| **Project Manager** | `pm@pms.com` | `Admin@123456` | Create/manage projects, assign vendors, track deadlines, file versioning |
| **Accounts** | `accounts@pms.com` | `Admin@123456` | Manage client invoices, record client payments, vendor payouts, financial reports |
| **Vendor / Translator** | `translator@pms.com` | `Vendor@123456` | View assigned projects only, upload work, download authorized files |

---

## 🔒 Security Architecture

1. **Authentication**: Passwords hashed using `bcrypt` (10 salt rounds). JWT authentication tokens issued via secure HTTP-Only cookies.
2. **Authorization (RBAC)**: All protected API endpoints verify user identity and check permission levels using Express `requireRole(['SUPER_ADMIN', 'ADMIN', ...])` middleware.
3. **Data Privacy**: Client revenue, total vendor costs, and profit margins are automatically filtered out when accessed by Vendor role accounts.
4. **File Security**: Files stored in private directory storage (`/backend/uploads`), served strictly through authorized streaming endpoints. Dangerous executable files (`.exe`, `.sh`, `.bat`) are blocked by MIME and extension validation.
5. **Rate Limiting & Headers**: Helmet security headers enabled, along with IP rate limiting (300 requests per 15 min window).
6. **Audit Logs**: Immutable audit log tracks user actions, IP addresses, entity IDs, and before/after state snapshots.

---

## 📂 Project Structure

```
translation-pms/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Database models, foreign keys & indexes
│   │   └── seed.js             # Initial database seed script
│   ├── src/
│   │   ├── config/             # Prisma client & JWT setup
│   │   ├── controllers/        # Express REST API business logic
│   │   ├── middleware/         # Auth, RBAC & Centralized Error Handler
│   │   ├── routes/             # Express routing modules
│   │   ├── utils/              # Audit logger & auto code generators
│   │   └── server.js           # Server entry point
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout/         # Sidebar, Navbar, AppLayout
│   │   │   └── UI/             # Badge, Button, Card, Modal, Tabs, StatCard
│   │   ├── contexts/           # AuthContext provider
│   │   ├── pages/              # 12 Full Module Views
│   │   ├── services/           # Axios API client
│   │   ├── App.jsx             # React Router setup
│   │   └── main.jsx            # React root entry point
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
└── README.md
```

---

## 💾 Database Backup & Recovery

### MySQL Backup Command
```bash
mysqldump -u root -p translation_pms > pms_backup_$(date +%F).sql
```

### MySQL Restore Command
```bash
mysql -u root -p translation_pms < pms_backup_YYYY-MM-DD.sql
```
