/*
  Warnings:

  - A unique constraint covering the columns `[pidx]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `pidx` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `payment` ADD COLUMN `pidx` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Payment_pidx_key` ON `Payment`(`pidx`);
