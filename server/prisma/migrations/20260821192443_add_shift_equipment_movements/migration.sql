-- CreateEnum
CREATE TYPE "EquipmentPhysicalStatus" AS ENUM ('EN_SALA_DE_ARMAS', 'EN_PODER');

-- CreateEnum
CREATE TYPE "EquipmentMovementType" AS ENUM ('RETIRO', 'ENTREGA');

-- AlterEnum
ALTER TYPE "AssignmentType" ADD VALUE 'SHIFT';

-- AlterTable
ALTER TABLE "assignment_details" ADD COLUMN     "physicalStatus" "EquipmentPhysicalStatus";

-- CreateTable
CREATE TABLE "equipment_movements" (
    "id" SERIAL NOT NULL,
    "assignmentDetailId" INTEGER NOT NULL,
    "movementType" "EquipmentMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "movedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "equipment_movements_assignmentDetailId_idx" ON "equipment_movements"("assignmentDetailId");

-- CreateIndex
CREATE INDEX "equipment_movements_movementType_idx" ON "equipment_movements"("movementType");

-- CreateIndex
CREATE INDEX "equipment_movements_movedAt_idx" ON "equipment_movements"("movedAt");

-- CreateIndex
CREATE INDEX "assignment_details_physicalStatus_idx" ON "assignment_details"("physicalStatus");

-- AddForeignKey
ALTER TABLE "equipment_movements" ADD CONSTRAINT "equipment_movements_assignmentDetailId_fkey" FOREIGN KEY ("assignmentDetailId") REFERENCES "assignment_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
