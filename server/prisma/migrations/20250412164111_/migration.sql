/*
  Warnings:

  - You are about to alter the column `floorNumber` on the `room` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.

*/
-- AlterTable
ALTER TABLE `hostelownernotification` ADD COLUMN `expiresAt` DATETIME(3) NULL,
    ADD COLUMN `linkUrl` VARCHAR(191) NULL,
    MODIFY `type` ENUM('BOOKING', 'PAYMENT', 'SYSTEM', 'MESSAGE', 'MAINTENANCE', 'APPROVAL', 'VERIFICATION', 'REVIEW', 'ACCOUNT', 'PROMOTION', 'ANNOUNCEMENT') NOT NULL;

-- AlterTable
ALTER TABLE `message` MODIFY `senderType` ENUM('USER', 'HOSTEL_OWNER', 'ADMIN') NOT NULL;

-- AlterTable
ALTER TABLE `notification` ADD COLUMN `expiresAt` DATETIME(3) NULL,
    ADD COLUMN `linkUrl` VARCHAR(191) NULL,
    MODIFY `type` ENUM('BOOKING', 'PAYMENT', 'SYSTEM', 'MESSAGE', 'MAINTENANCE', 'APPROVAL', 'VERIFICATION', 'REVIEW', 'ACCOUNT', 'PROMOTION', 'ANNOUNCEMENT') NOT NULL;

-- AlterTable
ALTER TABLE `room` MODIFY `floorNumber` INTEGER NULL;

-- CreateTable
CREATE TABLE `Admin` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('SUPER_ADMIN', 'CONTENT_MANAGER', 'SUPPORT_ADMIN', 'FINANCE_ADMIN') NOT NULL DEFAULT 'SUPER_ADMIN',
    `profileImage` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Admin_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdminNotification` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `adminId` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `type` ENUM('BOOKING', 'PAYMENT', 'SYSTEM', 'MESSAGE', 'MAINTENANCE', 'APPROVAL', 'VERIFICATION', 'REVIEW', 'ACCOUNT', 'PROMOTION', 'ANNOUNCEMENT') NOT NULL,
    `linkUrl` VARCHAR(191) NULL,
    `priority` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BroadcastNotification` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `receiverType` ENUM('ADMIN', 'USER', 'HOSTEL_OWNER', 'ALL') NOT NULL,
    `type` ENUM('BOOKING', 'PAYMENT', 'SYSTEM', 'MESSAGE', 'MAINTENANCE', 'APPROVAL', 'VERIFICATION', 'REVIEW', 'ACCOUNT', 'PROMOTION', 'ANNOUNCEMENT') NOT NULL,
    `linkUrl` VARCHAR(191) NULL,
    `priority` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NULL,
    `isSent` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AdminNotification` ADD CONSTRAINT `AdminNotification_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `Admin`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
