/*
  Warnings:

  - You are about to drop the `vote` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `vote` DROP FOREIGN KEY `Vote_answerId_fkey`;

-- DropForeignKey
ALTER TABLE `vote` DROP FOREIGN KEY `Vote_userId_fkey`;

-- DropTable
DROP TABLE `vote`;
