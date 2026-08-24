import { z } from "zod";

export const EQUIPMENT_TRACKING_MODES = [
  "INDIVIDUAL",
  "QUANTITY",
];

export const EQUIPMENT_CATEGORIES = [
  "ARMAMENTO",
  "PROTECCION",
  "COMUNICACIONES",
  "MUNICION",
  "ACCESORIO",
  "OTRO",
];

export const DEFAULT_ASSIGNMENT_TYPES = [
  "PERMANENT",
  "TEMPORARY",
];

export const equipmentTypeSchema = z
  .object({
    name: z
      .string({
        message:
          "El nombre del tipo de equipamiento es obligatorio",
      })
      .trim()
      .min(
        2,
        "El nombre debe tener al menos 2 caracteres",
      )
      .max(
        80,
        "El nombre no puede superar los 80 caracteres",
      ),

    category: z
      .enum(EQUIPMENT_CATEGORIES, {
        message:
          "La categoría seleccionada no es válida",
      })
      .default("OTRO"),

    trackingMode: z
      .enum(EQUIPMENT_TRACKING_MODES, {
        message:
          "El modo de control seleccionado no es válido",
      })
      .default("INDIVIDUAL"),

    defaultAssignmentType: z
      .union([
        z.enum(DEFAULT_ASSIGNMENT_TYPES, {
          message:
            "La modalidad de asignación seleccionada no es válida",
        }),
        z.null(),
      ])
      .optional(),

    description: z
      .string()
      .trim()
      .max(
        300,
        "La descripción no puede superar los 300 caracteres",
      )
      .optional()
      .nullable(),
  })
  .superRefine((data, ctx) => {
    // ARMAMENTO
    if (
      data.category === "ARMAMENTO" &&
      data.trackingMode !== "INDIVIDUAL"
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["trackingMode"],
        message:
          "El armamento debe utilizar control individual",
      });
    }

    // MUNICIÓN
    if (
      data.category === "MUNICION" &&
      data.trackingMode !== "QUANTITY"
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["trackingMode"],
        message:
          "La munición debe utilizar control por cantidad",
      });
    }
  });