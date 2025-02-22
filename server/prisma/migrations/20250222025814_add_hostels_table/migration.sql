-- CreateTable
CREATE TABLE `Hostels` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ownerId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `images` VARCHAR(191) NOT NULL,
    `price` DOUBLE NOT NULL,
    `facilities` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Hostels_ownerId_key`(`ownerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Hostels` ADD CONSTRAINT `Hostels_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `HostelOwner`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
