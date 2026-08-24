/*
  Warnings:

  - The values [SHIFT] on the enum `AssignmentType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `physicalStatus` on the `assignment_details` table. All the data in the column will be lost.
  - You are about to drop the `equipment_movements` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AssignmentType_new" AS ENUM ('PERMANENT', 'TEMPORARY');
ALTER TABLE "assignments" ALTER COLUMN "type" TYPE "AssignmentType_new" USING ("type"::text::"AssignmentType_new");
ALTER TYPE "AssignmentType" RENAME TO "AssignmentType_old";
ALTER TYPE "AssignmentType_new" RENAME TO "AssignmentType";
DROP TYPE "public"."AssignmentType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "equipment_movements" DROP CONSTRAINT "equipment_movements_assignmentDetailId_fkey";

-- DropIndex
DROP INDEX "assignment_details_physicalStatus_idx";

-- AlterTable
ALTER TABLE "assignment_details" DROP COLUMN "physicalStatus";

-- DropTable
DROP TABLE "equipment_movements";

-- DropEnum
DROP TYPE "EquipmentMovementType";

-- DropEnum
DROP TYPE "EquipmentPhysicalStatus";
