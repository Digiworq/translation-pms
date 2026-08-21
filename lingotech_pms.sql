-- ========================================================
-- LingoTech PMS Complete MySQL Database Dump
-- Schema & Initial Seed Data
-- Database: lingotech_pms
-- ========================================================

CREATE DATABASE IF NOT EXISTS `lingotech_pms`;
USE `lingotech_pms`;

-- --------------------------------------------------------
-- Table structure for User
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `User` (
  `id` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `password` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `role` VARCHAR(191) NOT NULL DEFAULT 'PROJECT_MANAGER',
  `avatarUrl` VARCHAR(191) NULL,
  `department` VARCHAR(191) NULL,
  `phone` VARCHAR(191) NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `User_email_key`(`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for Client
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `Client` (
  `id` VARCHAR(191) NOT NULL,
  `clientCode` VARCHAR(191) NOT NULL,
  `companyName` VARCHAR(191) NOT NULL,
  `contactPerson` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(191) NOT NULL,
  `address` VARCHAR(191) NULL,
  `gstNumber` VARCHAR(191) NULL,
  `paymentTerms` INT NOT NULL DEFAULT 30,
  `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Client_clientCode_key`(`clientCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for Vendor
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `Vendor` (
  `id` VARCHAR(191) NOT NULL,
  `vendorCode` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(191) NOT NULL,
  `country` VARCHAR(191) NULL,
  `ratePerWord` DOUBLE NOT NULL DEFAULT 0,
  `ratePerPage` DOUBLE NOT NULL DEFAULT 0,
  `rating` DOUBLE NOT NULL DEFAULT 5,
  `status` VARCHAR(191) NOT NULL DEFAULT 'AVAILABLE',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Vendor_vendorCode_key`(`vendorCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for Project
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `Project` (
  `id` VARCHAR(191) NOT NULL,
  `projectCode` VARCHAR(191) NOT NULL,
  `invoiceNumber` VARCHAR(191) NULL,
  `projectManagerId` VARCHAR(191) NOT NULL,
  `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `clientId` VARCHAR(191) NOT NULL,
  `clientAddress` VARCHAR(191) NULL,
  `clientContact` VARCHAR(191) NULL,
  `poNumber` VARCHAR(191) NULL,
  `gstNumber` VARCHAR(191) NULL,
  `projectName` VARCHAR(191) NOT NULL,
  `fileName` VARCHAR(191) NULL,
  `projectType` VARCHAR(191) NOT NULL DEFAULT 'Translation',
  `sourceLang` VARCHAR(191) NOT NULL,
  `targetLang` VARCHAR(191) NOT NULL,
  `wordCount` INT NOT NULL DEFAULT 0,
  `pageCount` INT NOT NULL DEFAULT 0,
  `ratePerWord` DOUBLE NOT NULL DEFAULT 0,
  `ratePerPage` DOUBLE NOT NULL DEFAULT 0,
  `clientAmount` DOUBLE NOT NULL DEFAULT 0,
  `totalVendorCost` DOUBLE NOT NULL DEFAULT 0,
  `grossProfit` DOUBLE NOT NULL DEFAULT 0,
  `profitMargin` DOUBLE NOT NULL DEFAULT 0,
  `paidAmount` DOUBLE NOT NULL DEFAULT 0,
  `outstandingAmount` DOUBLE NOT NULL DEFAULT 0,
  `startDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `deadline` DATETIME(3) NOT NULL,
  `priority` VARCHAR(191) NOT NULL DEFAULT 'MEDIUM',
  `status` VARCHAR(191) NOT NULL DEFAULT 'NEW',
  `paymentStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
  `notes` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Project_projectCode_key`(`projectCode`),
  CONSTRAINT `Project_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Project_projectManagerId_fkey` FOREIGN KEY (`projectManagerId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Seed Data Insertion
-- --------------------------------------------------------

INSERT INTO `User` (`id`, `email`, `password`, `name`, `role`, `createdAt`, `updatedAt`)
VALUES
('usr-admin-01', 'admin@pms.com', '$2a$10$HASHEDPASSWORD', 'Executive Super Admin', 'SUPER_ADMIN', NOW(), NOW())
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

INSERT INTO `Client` (`id`, `clientCode`, `companyName`, `contactPerson`, `email`, `phone`, `createdAt`, `updatedAt`)
VALUES
('clt-01', 'CLT-2026-0001', 'Global Enterprise Tech Corp', 'Alex Mercer', 'alex@globaltech.com', '+1 (800) 555-0199', NOW(), NOW()),
('clt-02', 'CLT-2026-0002', 'BioHealth Solutions Inc.', 'Sarah Jenkins', 's.jenkins@biohealth.org', '+1 (800) 555-0244', NOW(), NOW()),
('clt-03', 'CLT-2026-0003', 'Apex Financial Systems', 'Michael Chang', 'm.chang@apexfin.io', '+1 (800) 555-0388', NOW(), NOW())
ON DUPLICATE KEY UPDATE `companyName`=VALUES(`companyName`);

INSERT INTO `Vendor` (`id`, `vendorCode`, `name`, `email`, `phone`, `country`, `ratePerWord`, `createdAt`, `updatedAt`)
VALUES
('vnd-01', 'VND-0001', 'Hans Gruber', 'hans@bavaria-trans.com', '+49 89 123456', 'Germany', 1.5, NOW(), NOW())
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

INSERT INTO `Project` (`id`, `projectCode`, `projectName`, `projectType`, `sourceLang`, `targetLang`, `wordCount`, `ratePerWord`, `clientAmount`, `totalVendorCost`, `grossProfit`, `profitMargin`, `status`, `priority`, `deadline`, `clientId`, `projectManagerId`, `createdAt`, `updatedAt`)
VALUES
('prj-1', 'PRJ-2026-0001', 'Q3 Enterprise Software Manual Localization', 'Translation', 'English', 'German', 10000, 3.0, 30000, 9000, 21000, 70, 'NEW', 'HIGH', NOW(), 'clt-01', 'usr-admin-01', NOW(), NOW()),
('prj-2', 'PRJ-2026-0002', 'BioHealth Clinical Protocol Translation & Review', 'Certified Translation', 'English', 'Spanish', 15000, 4.0, 60000, 22500, 37500, 62.5, 'COMPLETED', 'URGENT', NOW(), 'clt-02', 'usr-admin-01', NOW(), NOW()),
('prj-3', 'PRJ-2026-0003', 'Mobile Banking App UI String Localization', 'Localization', 'English', 'Japanese', 8000, 3.5, 28000, 12000, 16000, 57.14, 'DELIVERED', 'MEDIUM', NOW(), 'clt-03', 'usr-admin-01', NOW(), NOW())
ON DUPLICATE KEY UPDATE `projectName`=VALUES(`projectName`);
