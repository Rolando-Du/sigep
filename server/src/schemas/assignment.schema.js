import { z } from "zod";

/*
 * TIPOS DE ASIGNACIÓN
 *
 * PERMANENT
 * El equipamiento está asignado
 * al oficial y permanece en su poder.
 *
 * TEMPORARY
 * El equipamiento está asignado
 * al oficial, pero se encuentra
 * resguardado en Sala de Armas.
 */
export const ASSIGNMENT_TYPES = [
  "PERMANENT",
  "TEMPORARY",
];

const assignmentDetailSchema =
  z.object({
    equipmentId: z.coerce
      .number({
        message:
          "El equipamiento es obligatorio",
      })
      .int(
        "El equipamiento seleccionado no es válido",
      )
      .positive(
        "El equipamiento seleccionado no es válido",
      ),

    quantity: z.coerce
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
  });

export const assignmentSchema = z
  .object({
    personnelId: z.coerce
      .number({
        message:
          "El personal es obligatorio",
      })
      .int(
        "El personal seleccionado no es válido",
      )
      .positive(
        "El personal seleccionado no es válido",
      ),

    type: z.enum(
      ASSIGNMENT_TYPES,
      {
        message:
          "El tipo de asignación no es válido",
      },
    ),

    details: z
      .array(
        assignmentDetailSchema,
      )
      .min(
        1,
        "La asignación debe contener al menos un equipamiento",
      ),

    observations: z
      .union([
        z
          .string()
          .trim()
          .max(
            1000,
            "Las observaciones no pueden superar los 1000 caracteres",
          ),

        z.literal(""),
        z.null(),
      ])
      .optional(),
  })
  .superRefine((data, ctx) => {
    const equipmentIds =
      data.details.map(
        (detail) =>
          detail.equipmentId,
      );

    const uniqueEquipmentIds =
      new Set(equipmentIds);

    if (
      uniqueEquipmentIds.size !==
      equipmentIds.length
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["details"],
        message:
          "El mismo equipamiento no puede agregarse dos veces a la asignación",
      });
    }
  });