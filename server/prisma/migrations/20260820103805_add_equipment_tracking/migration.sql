/*
  Warnings:

  - The `status` column on the `equipment` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "EquipmentTrackingMode" AS ENUM ('INDIVIDUAL', 'QUANTITY');

-- CreateEnum
CREATE TYPE "EquipmentStatus" AS ENUM ('DISPONIBLE', 'ASIGNADO', 'EN_CUSTODIA', 'EN_REPARACION', 'FUERA_DE_SERVICIO', 'BAJA');

-- AlterTable
ALTER TABLE "equipment" ADD COLUMN     "availableQuantity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "totalQuantity" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "inventoryNumber" DROP NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "EquipmentStatus" NOT NULL DEFAULT 'DISPONIBLE';

-- AlterTable
ALTER TABLE "equipment_types" ADD COLUMN     "trackingMode" "EquipmentTrackingMode" NOT NULL DEFAULT 'INDIVIDUAL';

-- CreateIndex
CREATE INDEX "equipment_status_idx" ON "equipment"("status");

-- CreateIndex
CREATE INDEX "equipment_types_trackingMode_idx" ON "equipment_types"("trackingMode");
