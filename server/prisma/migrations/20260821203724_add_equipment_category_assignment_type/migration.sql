-- CreateEnum
CREATE TYPE "EquipmentCategory" AS ENUM ('ARMAMENTO', 'PROTECCION', 'COMUNICACIONES', 'MUNICION', 'ACCESORIO', 'OTRO');

-- AlterTable
ALTER TABLE "equipment_types" ADD COLUMN     "category" "EquipmentCategory" NOT NULL DEFAULT 'OTRO',
ADD COLUMN     "defaultAssignmentType" "AssignmentType";

-- CreateIndex
CREATE INDEX "equipment_types_category_idx" ON "equipment_types"("category");

-- CreateIndex
CREATE INDEX "equipment_types_defaultAssignmentType_idx" ON "equipment_types"("defaultAssignmentType");
