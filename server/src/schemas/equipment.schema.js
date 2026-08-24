import { z } from "zod";

export const EQUIPMENT_STATUSES = [
  "DISPONIBLE",
  "ASIGNADO",
  "EN_CUSTODIA",
  "EN_REPARACION",
  "FUERA_DE_SERVICIO",
  "BAJA",
];

const optionalText = (max, message) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .nullable();

export const equipmentSchema = z.object({
  typeId: z.coerce
    .number({
      message:
        "El tipo de equipamiento es obligatorio",
    })
    .int(
      "El tipo de equipamiento no es válido",
    )
    .positive(
      "El tipo de equipamiento no es válido",
    ),

  inventoryNumber: optionalText(
    80,
    "El número de inventario no puede superar los 80 caracteres",
  ),

  serialNumber: optionalText(
    100,
    "El número de serie no puede superar los 100 caracteres",
  ),

  brand: optionalText(
    80,
    "La marca no puede superar los 80 caracteres",
  ),

  model: optionalText(
    100,
    "El modelo no puede superar los 100 caracteres",
  ),

  status: z
    .enum(EQUIPMENT_STATUSES, {
      message:
        "El estado seleccionado no es válido",
    })
    .default("DISPONIBLE"),

  totalQuantity: z.coerce
    .number({
      message:
        "La cantidad debe ser un número",
    })
    .int(
      "La cantidad debe ser un número entero",
    )
    .positive(
      "La cantidad debe ser mayor a cero",
    )
    .default(1),

  observations: optionalText(
    1000,
    "Las observaciones no pueden superar los 1000 caracteres",
  ),
});