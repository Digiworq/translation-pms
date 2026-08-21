-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `role` ENUM('SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'ACCOUNTS', 'VENDOR') NOT NULL DEFAULT 'PROJECT_MANAGER',
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `vendorId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_vendorId_key`(`vendorId`),
    INDEX `User_email_idx`(`email`),
    INDEX `User_role_idx`(`role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Client` (
    `id` VARCHAR(191) NOT NULL,
    `clientCode` VARCHAR(191) NOT NULL,
    `companyName` VARCHAR(191) NOT NULL,
    `contactPerson` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `address` TEXT NULL,
    `gstNumber` VARCHAR(191) NULL,
    `taxInfo` VARCHAR(191) NULL,
    `poInfo` VARCHAR(191) NULL,
    `paymentTerms` VARCHAR(191) NULL DEFAULT '30 Days',
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Client_clientCode_key`(`clientCode`),
    INDEX `Client_clientCode_idx`(`clientCode`),
    INDEX `Client_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Vendor` (
    `id` VARCHAR(191) NOT NULL,
    `vendorCode` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `companyName` VARCHAR(191) NULL,
    `address` TEXT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `gstNumber` VARCHAR(191) NULL,
    `paymentInfo` TEXT NULL,
    `specialization` VARCHAR(191) NULL,
    `projectTypes` VARCHAR(191) NULL,
    `ratePerWord` DOUBLE NOT NULL DEFAULT 0.0,
    `ratePerPage` DOUBLE NOT NULL DEFAULT 0.0,
    `hourlyRate` DOUBLE NOT NULL DEFAULT 0.0,
    `availability` ENUM('AVAILABLE', 'BUSY', 'UNAVAILABLE') NOT NULL DEFAULT 'AVAILABLE',
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `rating` DOUBLE NOT NULL DEFAULT 5.0,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Vendor_vendorCode_key`(`vendorCode`),
    INDEX `Vendor_vendorCode_idx`(`vendorCode`),
    INDEX `Vendor_email_idx`(`email`),
    INDEX `Vendor_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VendorLanguage` (
    `id` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `sourceLang` VARCHAR(191) NOT NULL,
    `targetLang` VARCHAR(191) NOT NULL,

    INDEX `VendorLanguage_vendorId_idx`(`vendorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Project` (
    `id` VARCHAR(191) NOT NULL,
    `projectCode` VARCHAR(191) NOT NULL,
    `invoiceNumber` VARCHAR(191) NULL,
    `projectManagerId` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `clientId` VARCHAR(191) NOT NULL,
    `clientAddress` TEXT NULL,
    `clientContact` VARCHAR(191) NULL,
    `poNumber` VARCHAR(191) NULL,
    `gstNumber` VARCHAR(191) NULL,
    `projectName` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NULL,
    `projectType` VARCHAR(191) NOT NULL,
    `sourceLang` VARCHAR(191) NOT NULL,
    `targetLang` VARCHAR(191) NOT NULL,
    `wordCount` INTEGER NOT NULL DEFAULT 0,
    `pageCount` INTEGER NOT NULL DEFAULT 0,
    `ratePerWord` DOUBLE NOT NULL DEFAULT 0.0,
    `ratePerPage` DOUBLE NOT NULL DEFAULT 0.0,
    `clientAmount` DOUBLE NOT NULL DEFAULT 0.0,
    `totalVendorCost` DOUBLE NOT NULL DEFAULT 0.0,
    `grossProfit` DOUBLE NOT NULL DEFAULT 0.0,
    `profitMargin` DOUBLE NOT NULL DEFAULT 0.0,
    `paidAmount` DOUBLE NOT NULL DEFAULT 0.0,
    `outstandingAmount` DOUBLE NOT NULL DEFAULT 0.0,
    `startDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deadline` DATETIME(3) NOT NULL,
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
    `status` ENUM('NEW', 'ASSIGNED', 'IN_PROGRESS', 'UNDER_REVIEW', 'COMPLETED', 'DELIVERED', 'ON_HOLD', 'CANCELLED') NOT NULL DEFAULT 'NEW',
    `paymentStatus` ENUM('PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE') NOT NULL DEFAULT 'PENDING',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Project_projectCode_key`(`projectCode`),
    INDEX `Project_projectCode_idx`(`projectCode`),
    INDEX `Project_clientId_idx`(`clientId`),
    INDEX `Project_projectManagerId_idx`(`projectManagerId`),
    INDEX `Project_status_idx`(`status`),
    INDEX `Project_deadline_idx`(`deadline`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectVendor` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `taskType` VARCHAR(191) NOT NULL,
    `sourceLang` VARCHAR(191) NULL,
    `targetLang` VARCHAR(191) NULL,
    `assignedWords` INTEGER NOT NULL DEFAULT 0,
    `assignedPages` INTEGER NOT NULL DEFAULT 0,
    `vendorRate` DOUBLE NOT NULL DEFAULT 0.0,
    `vendorAmount` DOUBLE NOT NULL DEFAULT 0.0,
    `startDate` DATETIME(3) NULL,
    `deadline` DATETIME(3) NULL,
    `status` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ProjectVendor_projectId_idx`(`projectId`),
    INDEX `ProjectVendor_vendorId_idx`(`vendorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectFile` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `fileType` VARCHAR(191) NOT NULL,
    `fileSize` INTEGER NOT NULL,
    `mimeType` VARCHAR(191) NULL,
    `storagePath` VARCHAR(191) NOT NULL,
    `uploadedById` VARCHAR(191) NOT NULL,
    `version` VARCHAR(191) NOT NULL DEFAULT 'v1',
    `description` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ProjectFile_projectId_idx`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Invoice` (
    `id` VARCHAR(191) NOT NULL,
    `invoiceNumber` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NULL,
    `invoiceDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dueDate` DATETIME(3) NOT NULL,
    `poNumber` VARCHAR(191) NULL,
    `gstNumber` VARCHAR(191) NULL,
    `subtotal` DOUBLE NOT NULL DEFAULT 0.0,
    `taxAmount` DOUBLE NOT NULL DEFAULT 0.0,
    `discount` DOUBLE NOT NULL DEFAULT 0.0,
    `grandTotal` DOUBLE NOT NULL DEFAULT 0.0,
    `paidAmount` DOUBLE NOT NULL DEFAULT 0.0,
    `balanceAmount` DOUBLE NOT NULL DEFAULT 0.0,
    `paymentStatus` ENUM('PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE') NOT NULL DEFAULT 'PENDING',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Invoice_invoiceNumber_key`(`invoiceNumber`),
    INDEX `Invoice_invoiceNumber_idx`(`invoiceNumber`),
    INDEX `Invoice_clientId_idx`(`clientId`),
    INDEX `Invoice_paymentStatus_idx`(`paymentStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InvoiceItem` (
    `id` VARCHAR(191) NOT NULL,
    `invoiceId` VARCHAR(191) NOT NULL,
    `service` VARCHAR(191) NOT NULL,
    `language` VARCHAR(191) NULL,
    `quantity` DOUBLE NOT NULL DEFAULT 1.0,
    `unit` VARCHAR(191) NOT NULL DEFAULT 'word',
    `rate` DOUBLE NOT NULL DEFAULT 0.0,
    `amount` DOUBLE NOT NULL DEFAULT 0.0,

    INDEX `InvoiceItem_invoiceId_idx`(`invoiceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ClientPayment` (
    `id` VARCHAR(191) NOT NULL,
    `invoiceId` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NULL,
    `paymentDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `amount` DOUBLE NOT NULL DEFAULT 0.0,
    `paymentMethod` VARCHAR(191) NOT NULL,
    `transactionRef` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'COMPLETED',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ClientPayment_invoiceId_idx`(`invoiceId`),
    INDEX `ClientPayment_clientId_idx`(`clientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VendorInvoice` (
    `id` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NULL,
    `vendorAssignmentId` VARCHAR(191) NULL,
    `vendorInvoiceNumber` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL DEFAULT 0.0,
    `invoiceDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dueDate` DATETIME(3) NULL,
    `status` ENUM('PENDING', 'APPROVED', 'PROCESSING', 'PAID', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `VendorInvoice_vendorId_idx`(`vendorId`),
    INDEX `VendorInvoice_projectId_idx`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VendorPayment` (
    `id` VARCHAR(191) NOT NULL,
    `vendorInvoiceId` VARCHAR(191) NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NULL,
    `amount` DOUBLE NOT NULL DEFAULT 0.0,
    `paymentDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `paymentMethod` VARCHAR(191) NOT NULL,
    `transactionRef` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PAID',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `VendorPayment_vendorId_idx`(`vendorId`),
    INDEX `VendorPayment_projectId_idx`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `link` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Notification_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `userName` VARCHAR(191) NOT NULL,
    `userRole` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `entity` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NULL,
    `ipAddress` VARCHAR(191) NULL,
    `beforeValue` TEXT NULL,
    `afterValue` TEXT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_entity_idx`(`entity`),
    INDEX `AuditLog_entityId_idx`(`entityId`),
    INDEX `AuditLog_timestamp_idx`(`timestamp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectNote` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `note` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProjectNote_projectId_idx`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SystemSetting` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` TEXT NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SystemSetting_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `Vendor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VendorLanguage` ADD CONSTRAINT `VendorLanguage_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `Vendor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_projectManagerId_fkey` FOREIGN KEY (`projectManagerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectVendor` ADD CONSTRAINT `ProjectVendor_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectVendor` ADD CONSTRAINT `ProjectVendor_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `Vendor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectFile` ADD CONSTRAINT `ProjectFile_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectFile` ADD CONSTRAINT `ProjectFile_uploadedById_fkey` FOREIGN KEY (`uploadedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InvoiceItem` ADD CONSTRAINT `InvoiceItem_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientPayment` ADD CONSTRAINT `ClientPayment_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientPayment` ADD CONSTRAINT `ClientPayment_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientPayment` ADD CONSTRAINT `ClientPayment_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VendorInvoice` ADD CONSTRAINT `VendorInvoice_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `Vendor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VendorInvoice` ADD CONSTRAINT `VendorInvoice_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VendorInvoice` ADD CONSTRAINT `VendorInvoice_vendorAssignmentId_fkey` FOREIGN KEY (`vendorAssignmentId`) REFERENCES `ProjectVendor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VendorPayment` ADD CONSTRAINT `VendorPayment_vendorInvoiceId_fkey` FOREIGN KEY (`vendorInvoiceId`) REFERENCES `VendorInvoice`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VendorPayment` ADD CONSTRAINT `VendorPayment_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `Vendor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VendorPayment` ADD CONSTRAINT `VendorPayment_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectNote` ADD CONSTRAINT `ProjectNote_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectNote` ADD CONSTRAINT `ProjectNote_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
