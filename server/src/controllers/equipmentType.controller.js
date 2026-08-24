import prisma from "../lib/prisma.js";

import {
  equipmentTypeSchema,
} from "../schemas/equipmentType.schema.js";

const formatValidationErrors = (
  issues,
) =>
  issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));

const GENERIC_CATEGORY_NAMES =
  new Set([
    "armamento",
    "proteccion",
    "protección",
    "comunicaciones",
    "municion",
    "munición",
    "accesorio",
    "accesorios",
    "otro",
  ]);

/*
 * GET /api/v1/equipment-types
 *
 * Devuelve todos los tipos de
 * equipamiento ordenados primero
 * por categoría y luego por nombre.
 */
export const getEquipmentTypes =
  async (
    req,
    res,
  ) => {
    try {
      const equipmentTypes =
        await prisma.equipmentType.findMany(
          {
            orderBy: [
              {
                category:
                  "asc",
              },
              {
                name:
                  "asc",
              },
            ],
          },
        );

      return res
        .status(200)
        .json({
          success: true,
          data: equipmentTypes,
        });
    } catch (error) {
      console.error(
        "Error al obtener tipos de equipamiento:",
        error,
      );

      return res
        .status(500)
        .json({
          success: false,
          error: {
            message:
              "No se pudieron obtener los tipos de equipamiento",
          },
        });
    }
  };

/*
 * POST /api/v1/equipment-types
 */
export const createEquipmentType =
  async (
    req,
    res,
  ) => {
    try {
      /*
       * NORMALIZACIÓN PREVIA
       *
       * La condición de consumible
       * no depende exclusivamente
       * de lo enviado por el frontend.
       *
       * Toda categoría MUNICION
       * se considera consumible.
       */
      const normalizedPayload = {
        ...req.body,

        isConsumable:
          req.body?.category ===
          "MUNICION"
            ? true
            : Boolean(
                req.body
                  ?.isConsumable,
              ),
      };

      const validation =
        equipmentTypeSchema.safeParse(
          normalizedPayload,
        );

      if (!validation.success) {
        return res
          .status(400)
          .json({
            success: false,
            error: {
              message:
                "Los datos ingresados no son válidos",

              details:
                formatValidationErrors(
                  validation.error
                    .issues,
                ),
            },
          });
      }

      const {
        name,
        trackingMode,
        description,
        category,
        isConsumable,
        defaultAssignmentType,
      } = validation.data;

      /*
       * Evitamos volver a crear
       * categorías como si fueran
       * tipos específicos.
       *
       * Incorrecto:
       *
       * Armamento
       * Munición
       *
       * Correcto:
       *
       * Pistola
       * Escopeta
       * Munición 9 mm
       * Munición calibre 12
       * Munición calibre 12 - Posta de goma
       */
      const normalizedName =
        name
          .trim()
          .toLowerCase();

      if (
        GENERIC_CATEGORY_NAMES.has(
          normalizedName,
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error: {
              message:
                "Ingresá un tipo específico de equipamiento",

              details: [
                {
                  field:
                    "name",

                  message:
                    "La categoría no puede utilizarse como tipo. Por ejemplo, para Armamento utilizá Pistola o Escopeta y para Munición utilizá un calibre o clase específica.",
                },
              ],
            },
          });
      }

      /*
       * REGLA DE ARMAMENTO
       *
       * Todo armamento se registra
       * individualmente y debe tener
       * una modalidad logística
       * predeterminada.
       */
      if (
        category ===
        "ARMAMENTO"
      ) {
        if (
          trackingMode !==
          "INDIVIDUAL"
        ) {
          return res
            .status(400)
            .json({
              success: false,
              error: {
                message:
                  "El armamento debe administrarse de forma individual",

                details: [
                  {
                    field:
                      "trackingMode",

                    message:
                      "Los tipos de armamento deben utilizar control individual.",
                  },
                ],
              },
            });
        }

        if (
          !defaultAssignmentType
        ) {
          return res
            .status(400)
            .json({
              success: false,
              error: {
                message:
                  "El armamento requiere una modalidad de asignación",

                details: [
                  {
                    field:
                      "defaultAssignmentType",

                    message:
                      "Indicá si este armamento es de asignación permanente o temporaria.",
                  },
                ],
              },
            });
        }

        if (isConsumable) {
          return res
            .status(400)
            .json({
              success: false,
              error: {
                message:
                  "El armamento no puede configurarse como consumible",

                details: [
                  {
                    field:
                      "isConsumable",

                    message:
                      "Pistolas, escopetas y demás armamento deben devolverse físicamente y no pueden ser consumibles.",
                  },
                ],
              },
            });
        }
      }

      /*
       * REGLA DE MUNICIÓN
       *
       * Toda munición:
       *
       * - se administra por cantidad
       * - es consumible
       *
       * Esto permitirá posteriormente
       * distinguir:
       *
       * - unidades devueltas sin uso
       * - unidades utilizadas
       */
      if (
        category ===
        "MUNICION"
      ) {
        if (
          trackingMode !==
          "QUANTITY"
        ) {
          return res
            .status(400)
            .json({
              success: false,
              error: {
                message:
                  "La munición debe administrarse por cantidad",

                details: [
                  {
                    field:
                      "trackingMode",

                    message:
                      "Los tipos de munición deben utilizar control por cantidad.",
                  },
                ],
              },
            });
        }

        if (!isConsumable) {
          return res
            .status(400)
            .json({
              success: false,
              error: {
                message:
                  "La munición debe configurarse como consumible",

                details: [
                  {
                    field:
                      "isConsumable",

                    message:
                      "La munición puede ser utilizada durante una asignación y debe registrarse como consumible.",
                  },
                ],
              },
            });
        }
      }

      /*
       * REGLA GENERAL
       *
       * Todo elemento consumible
       * debe administrarse mediante
       * cantidades.
       */
      if (
        isConsumable &&
        trackingMode !==
          "QUANTITY"
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error: {
              message:
                "Los elementos consumibles deben administrarse por cantidad",

              details: [
                {
                  field:
                    "trackingMode",

                  message:
                    "Un elemento consumible no puede utilizar control individual.",
                },
              ],
            },
          });
      }

      /*
       * Evitamos tipos duplicados,
       * independientemente de
       * mayúsculas y minúsculas.
       */
      const existingType =
        await prisma.equipmentType.findFirst(
          {
            where: {
              name: {
                equals:
                  name,

                mode:
                  "insensitive",
              },
            },
          },
        );

      if (existingType) {
        return res
          .status(409)
          .json({
            success: false,
            error: {
              message:
                "Ya existe un tipo de equipamiento con ese nombre",

              details: [
                {
                  field:
                    "name",

                  message:
                    "Ya existe un tipo de equipamiento con ese nombre",
                },
              ],
            },
          });
      }

      const equipmentType =
        await prisma.equipmentType.create(
          {
            data: {
              name:
                name.trim(),

              trackingMode,

              category,

              isConsumable,

              defaultAssignmentType:
                defaultAssignmentType ||
                null,

              description:
                description?.trim() ||
                null,
            },
          },
        );

      return res
        .status(201)
        .json({
          success: true,
          data:
            equipmentType,
        });
    } catch (error) {
      console.error(
        "Error al crear tipo de equipamiento:",
        error,
      );

      /*
       * Segunda protección ante
       * nombres duplicados.
       */
      if (
        error?.code ===
        "P2002"
      ) {
        return res
          .status(409)
          .json({
            success: false,
            error: {
              message:
                "Ya existe un tipo de equipamiento con ese nombre",

              details: [
                {
                  field:
                    "name",

                  message:
                    "Ya existe un tipo de equipamiento con ese nombre",
                },
              ],
            },
          });
      }

      return res
        .status(500)
        .json({
          success: false,
          error: {
            message:
              "No se pudo crear el tipo de equipamiento",
          },
        });
    }
  };