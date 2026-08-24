-- CreateTable
CREATE TABLE "equipment_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" SERIAL NOT NULL,
    "typeId" INTEGER NOT NULL,
    "inventoryNumber" TEXT NOT NULL,
    "serialNumber" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DISPONIBLE',
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "equipment_types_name_key" ON "equipment_types"("name");

-- CreateIndex
CREATE INDEX "equipment_types_name_idx" ON "equipment_types"("name");

-- CreateIndex
CREATE INDEX "equipment_types_isActive_idx" ON "equipment_types"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_inventoryNumber_key" ON "equipment"("inventoryNumber");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_serialNumber_key" ON "equipment"("serialNumber");

-- CreateIndex
CREATE INDEX "equipment_typeId_idx" ON "equipment"("typeId");

-- CreateIndex
CREATE INDEX "equipment_status_idx" ON "equipment"("status");

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "equipment_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
