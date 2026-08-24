UPDATE "equipment_types"
SET
  "defaultAssignmentType" = 'PERMANENT',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "name" = 'Pistola';

UPDATE "equipment_types"
SET
  "defaultAssignmentType" = 'TEMPORARY',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "name" = 'Chaleco Balístico';

UPDATE "equipment_types"
SET
  "defaultAssignmentType" = NULL,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "name" IN (
  'Escopeta',
  'HT',
  'Cargador',
  'Munición 9 mm',
  'Munición calibre 12',
  'Munición calibre 12 - Posta de goma'
);

UPDATE "equipment_types"
SET
  "description" = 'Armamento largo administrado como stock general.',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "name" = 'Escopeta';

UPDATE "equipment_types"
SET
  "description" = 'Radio portátil administrada como stock general.',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "name" = 'HT';
