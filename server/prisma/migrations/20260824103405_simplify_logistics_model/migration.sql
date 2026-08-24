/*
  Warnings:

  - You are about to drop the column `consumedQuantity` on the `assignment_details` table. All the data in the column will be lost.
  - You are about to drop the column `isConsumable` on the `equipment_types` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "equipment_types_isConsumable_idx";

-- AlterTable
ALTER TABLE "assignment_details" DROP COLUMN "consumedQuantity";

-- AlterTable
ALTER TABLE "equipment_types" DROP COLUMN "isConsumable";
