# 🗄️ LingoTech PMS - Database Setup & Import Guide

This document provides clear, step-by-step instructions for clients and developers to set up, initialize, and import the MySQL database (`lingotech_pms`).

---

## 📋 Prerequisites

1. **MySQL Server 8.0+** installed and running on your system or cloud server.
2. **Node.js (v18+)** installed.

---

## ⚡ Option 1: Automatic 1-Command Setup (Recommended)

This is the fastest and easiest method. It creates all database tables, sets up foreign-key dependencies, and seeds initial system data automatically.

### Steps:

1. **Configure Environment Variables**:
   Open `backend/.env` (or copy from `backend/.env.example`) and set your MySQL connection string:
   ```env
   DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/lingotech_pms"
   ```

2. **Create Tables & Import Data**:
   Run the following commands in your project root terminal:

   ```bash
   # Step A: Run Prisma Database Migration (Creates all 16 tables)
   npm run prisma:migrate

   # Step B: Import & Seed System Data into MySQL
   npm run seed:mysql
   ```

3. **Verify Setup**:
   Log into MySQL and verify:
   ```sql
   USE lingotech_pms;
   SELECT projectCode, projectName, status FROM Project;
   ```

---

## 📄 Option 2: Import via MySQL Command Line (`lingotech_pms.sql`)

If you prefer using direct SQL dump files:

1. Open your terminal or Command Prompt.
2. Run the following import command using the provided `lingotech_pms.sql` file:

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS lingotech_pms;"
mysql -u root -p lingotech_pms < lingotech_pms.sql
```

---

## 🖥️ Option 3: Import via MySQL Workbench (GUI)

If you use MySQL Workbench:

1. Open **MySQL Workbench** and connect to your MySQL Server.
2. Go to **File -> Open SQL Script...** (or press `Ctrl + O`).
3. Select the file **`lingotech_pms.sql`** located in the root of this project folder.
4. Click the ⚡ **Execute Lightning Bolt** icon at the top of the SQL editor.
5. Right-click the schemas list and click **Refresh All**. You will see `lingotech_pms` with all tables and data.

---

## 📊 Summary of Database Tables Created

| Table Name | Description |
| :--- | :--- |
| **`Project`** | Translation & localization jobs (`PRJ-2026-0001`, word counts, rates, deadline, status). |
| **`Client`** | Customer accounts, contact details, payment terms. |
| **`Vendor`** | Translator profiles, domain specializations, word rates. |
| **`User`** | System user accounts & roles (`SUPER_ADMIN`, `PROJECT_MANAGER`, `ACCOUNTS`). |
| **`Invoice`** | Client billing tax invoices. |
| **`InvoiceItem`** | Itemized translation line items per invoice. |
| **`ClientPayment`** | Payment transaction receipts. |
| **`VendorPayment`** | Vendor payout disbursement records. |
| **`AuditLog`** | System activity audit history. |

---

## 🛠️ Helpful Commands Reference

| Command | Action |
| :--- | :--- |
| `npm run seed:mysql` | Seeds/Syncs active website projects into MySQL |
| `npm run clean:mysql` | Removes deleted test records from MySQL |
| `npm run prisma:studio` | Opens interactive web GUI to view/edit database records |

---

Need assistance? Contact your system administrator or project manager.
