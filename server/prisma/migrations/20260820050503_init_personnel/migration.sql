-- CreateTable
CREATE TABLE "personnel" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "fileNumber" TEXT NOT NULL,
    "rank" TEXT NOT NULL,
    "bloodType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Activo',
    "unit" TEXT NOT NULL,
    "primaryArea" TEXT NOT NULL,
    "additionalAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "dutyFunction" TEXT,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personnel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "personnel_dni_key" ON "personnel"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "personnel_fileNumber_key" ON "personnel"("fileNumber");

-- CreateIndex
CREATE INDEX "personnel_lastName_idx" ON "personnel"("lastName");

-- CreateIndex
CREATE INDEX "personnel_status_idx" ON "personnel"("status");

-- CreateIndex
CREATE INDEX "personnel_rank_idx" ON "personnel"("rank");

-- CreateIndex
CREATE INDEX "personnel_primaryArea_idx" ON "personnel"("primaryArea");
