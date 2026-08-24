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
      .enum(
        EQUIPMENT_CATEGORIES,
        {
          message:
            "La categoría seleccionada no es válida",
        },
      )
      .default("OTRO"),

    trackingMode: z
      .enum(
        EQUIPMENT_TRACKING_MODES,
        {
          message:
            "El modo de control seleccionado no es válido",
        },
      )
      .default("INDIVIDUAL"),

    /*
     * CONSUMIBLE
     *
     * true:
     * elementos que pueden utilizarse
     * y no necesariamente regresar
     * físicamente al stock.
     *
     * Ejemplos:
     * - Munición 9 mm
     * - Munición calibre 12 convencional
     * - Munición calibre 12 posta de goma
     *
     * false:
     * elementos reutilizables.
     *
     * Ejemplos:
     * - Pistola
     * - Escopeta
     * - HT
     * - Chaleco
     * - Cargador
     */
    isConsumable: z
      .boolean({
        message:
          "El indicador de consumible no es válido",
      })
      .default(false),

    defaultAssignmentType: z
      .union([
        z.enum(
          DEFAULT_ASSIGNMENT_TYPES,
          {
            message:
              "La modalidad de asignación seleccionada no es válida",
          },
        ),
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
    /*
     * ARMAMENTO
     *
     * Todo armamento se identifica
     * individualmente.
     */
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

    /*
     * Todo ARMAMENTO debe indicar
     * su modalidad logística.
     *
     * Pistola:
     * PERMANENT
     *
     * Escopeta:
     * TEMPORARY
     */
    if (
      data.category === "ARMAMENTO" &&
      !data.defaultAssignmentType
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["defaultAssignmentType"],
        message:
          "El armamento debe indicar si su asignación es permanente o temporaria",
      });
    }

    /*
     * El armamento no es consumible.
     */
    if (
      data.category === "ARMAMENTO" &&
      data.isConsumable
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["isConsumable"],
        message:
          "El armamento no puede configurarse como consumible",
      });
    }

    /*
     * MUNICIÓN
     *
     * Toda munición se administra
     * mediante cantidades de stock.
     */
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

    /*
     * Toda munición es consumible.
     *
     * Esto permite posteriormente
     * diferenciar:
     *
     * - cantidad devuelta sin uso
     * - cantidad utilizada/consumida
     */
    if (
      data.category === "MUNICION" &&
      !data.isConsumable
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["isConsumable"],
        message:
          "La munición debe configurarse como consumible",
      });
    }

    /*
     * Cualquier elemento marcado
     * como consumible debe manejarse
     * por cantidad.
     */
    if (
      data.isConsumable &&
      data.trackingMode !== "QUANTITY"
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["trackingMode"],
        message:
          "Los elementos consumibles deben administrarse por cantidad",
      });
    }
  });