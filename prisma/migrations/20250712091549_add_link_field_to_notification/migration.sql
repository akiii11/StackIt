/*
  Warnings:

  - You are about to drop the column `isRead` on the `notification` table. All the data in the column will be lost.
  - Added the required column `link` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `notification` DROP COLUMN `isRead`,
    ADD COLUMN `link` VARCHAR(191) NOT NULL;
