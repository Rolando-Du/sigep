-- AlterTable
ALTER TABLE "assignment_details" ADD COLUMN     "consumedQuantity" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "equipment_types" ADD COLUMN     "isConsumable" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "equipment_types_isConsumable_idx" ON "equipment_types"("isConsumable");
