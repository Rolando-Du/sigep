import prisma from "../lib/prisma.js";

import {
  equipmentSchema,
} from "../schemas/equipment.schema.js";

const formatValidationErrors = (
  issues,
) =>
  issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));

const findDuplicateEquipment =
  async ({
    inventoryNumber,
    serialNumber,
    excludeId = null,
  }) => {
    const conditions = [];

    if (inventoryNumber) {
      conditions.push({
        inventoryNumber: {
          equals:
            inventoryNumber,
          mode: "insensitive",
        },
      });
    }

    if (serialNumber) {
      conditions.push({
        serialNumber: {
          equals: serialNumber,
          mode: "insensitive",
        },
      });
    }

    if (
      conditions.length === 0
    ) {
      return [];
    }

    const duplicatedEquipment =
      await prisma.equipment.findMany({
        where: {
          OR: conditions,

          ...(excludeId
            ? {
                id: {
                  not: excludeId,
                },
              }
            : {}),
        },

        select: {
          id: true,
          inventoryNumber: true,
          serialNumber: true,
        },
      });

    const details = [];

    if (
      inventoryNumber &&
      duplicatedEquipment.some(
        (equipment) =>
          equipment.inventoryNumber?.toLowerCase() ===
          inventoryNumber.toLowerCase(),
      )
    ) {
      details.push({
        field:
          "inventoryNumber",

        message:
          "Ya existe un equipo con ese número de inventario",
      });
    }

    if (
      serialNumber &&
      duplicatedEquipment.some(
        (equipment) =>
          equipment.serialNumber?.toLowerCase() ===
          serialNumber.toLowerCase(),
      )
    ) {
      details.push({
        field:
          "serialNumber",

        message:
          "Ya existe un equipo con ese número de serie",
      });
    }

    return details;
  };

const getPendingAssignmentQuantity =
  async (
    equipmentId,
    client = prisma,
  ) => {
    const details =
      await client.assignmentDetail.findMany({
        where: {
          equipmentId,

          assignment: {
            status:
              "ACTIVE",
          },
        },

        select: {
          quantity: true,
          returnedQuantity: true,
        },
      });

    return details.reduce(
      (
        total,
        detail,
      ) =>
        total +
        Math.max(
          0,
          detail.quantity -
            detail.returnedQuantity,
        ),
      0,
    );
  };

export const getEquipment = async (
  req,
  res,
) => {
  try {
    const equipment =
      await prisma.equipment.findMany({
        include: {
          type: true,
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    return res.status(200).json({
      success: true,
      data: equipment,
    });
  } catch (error) {
    console.error(
      "Error al obtener equipamiento:",
      error,
    );

    return res.status(500).json({
      success: false,

      error: {
        message:
          "No se pudo obtener el equipamiento",
      },
    });
  }
};

export const createEquipment =
  async (req, res) => {
    try {
      /*
       * 1. Validamos los datos generales.
       */
      const validation =
        equipmentSchema.safeParse(
          req.body,
        );

      if (
        !validation.success
      ) {
        return res.status(400).json({
          success: false,

          error: {
            message:
              "Los datos ingresados no son válidos",

            details:
              formatValidationErrors(
                validation.error.issues,
              ),
          },
        });
      }

      const {
        typeId,
        inventoryNumber,
        serialNumber,
        brand,
        model,
        status,
        totalQuantity,
        observations,
      } = validation.data;

      /*
       * 2. Buscamos el tipo real
       * en la base de datos.
       */
      const equipmentType =
        await prisma.equipmentType.findUnique({
          where: {
            id: typeId,
          },
        });

      if (!equipmentType) {
        return res.status(400).json({
          success: false,

          error: {
            message:
              "El tipo de equipamiento seleccionado no existe",

            details: [
              {
                field:
                  "typeId",

                message:
                  "El tipo de equipamiento seleccionado no existe",
              },
            ],
          },
        });
      }

      /*
       * 3. No permitimos crear
       * equipos con tipos inactivos.
       */
      if (
        !equipmentType.isActive
      ) {
        return res.status(400).json({
          success: false,

          error: {
            message:
              "El tipo de equipamiento seleccionado está inactivo",

            details: [
              {
                field:
                  "typeId",

                message:
                  "El tipo de equipamiento seleccionado está inactivo",
              },
            ],
          },
        });
      }

      /*
       * 4. ASIGNADO no puede
       * establecerse manualmente.
       */
      if (
        status ===
        "ASIGNADO"
      ) {
        return res.status(400).json({
          success: false,

          error: {
            message:
              "Un equipo nuevo no puede registrarse directamente como asignado",

            details: [
              {
                field:
                  "status",

                message:
                  "El estado ASIGNADO se establece desde el módulo de Asignaciones",
              },
            ],
          },
        });
      }

      const normalizedInventoryNumber =
        inventoryNumber?.trim() ||
        null;

      const normalizedSerialNumber =
        serialNumber?.trim() ||
        null;

      /*
       * 5. Todo equipamiento
       * INDIVIDUAL debe tener
       * número de serie.
       *
       * El inventario es adicional
       * y puede ser opcional.
       */
      if (
        equipmentType.trackingMode ===
          "INDIVIDUAL" &&
        !normalizedSerialNumber
      ) {
        return res.status(400).json({
          success: false,

          error: {
            message:
              "El equipamiento individual necesita un número de serie",

            details: [
              {
                field:
                  "serialNumber",

                message:
                  "Ingresá el número de serie del equipo",
              },
            ],
          },
        });
      }

      /*
       * 6. Verificamos identificadores
       * únicos.
       */
      const duplicateDetails =
        await findDuplicateEquipment({
          inventoryNumber:
            normalizedInventoryNumber,

          serialNumber:
            normalizedSerialNumber,
        });

      if (
        duplicateDetails.length >
        0
      ) {
        return res.status(409).json({
          success: false,

          error: {
            message:
              "Ya existe equipamiento con alguno de los identificadores ingresados",

            details:
              duplicateDetails,
          },
        });
      }

      /*
       * 7. Calculamos cantidades.
       */
      let finalTotalQuantity = 1;
      let finalAvailableQuantity =
        1;

      if (
        equipmentType.trackingMode ===
        "QUANTITY"
      ) {
        finalTotalQuantity =
          totalQuantity;

        finalAvailableQuantity =
          status ===
          "DISPONIBLE"
            ? totalQuantity
            : 0;
      } else {
        finalTotalQuantity = 1;

        finalAvailableQuantity =
          status ===
          "DISPONIBLE"
            ? 1
            : 0;
      }

      /*
       * 8. Creamos el registro.
       */
      const equipment =
        await prisma.equipment.create({
          data: {
            typeId,

            inventoryNumber:
              normalizedInventoryNumber,

            serialNumber:
              normalizedSerialNumber,

            brand:
              brand?.trim() ||
              null,

            model:
              model?.trim() ||
              null,

            status,

            totalQuantity:
              finalTotalQuantity,

            availableQuantity:
              finalAvailableQuantity,

            observations:
              observations?.trim() ||
              null,
          },

          include: {
            type: true,
          },
        });

      return res.status(201).json({
        success: true,
        data: equipment,
      });
    } catch (error) {
      console.error(
        "Error al crear equipamiento:",
        error,
      );

      if (
        error?.code ===
        "P2002"
      ) {
        return res.status(409).json({
          success: false,

          error: {
            message:
              "Ya existe equipamiento con alguno de los identificadores ingresados",
          },
        });
      }

      return res.status(500).json({
        success: false,

        error: {
          message:
            "No se pudo crear el equipamiento",
        },
      });
    }
  };

/*
 * ACTUALIZAR EQUIPAMIENTO
 *
 * Permite corregir datos,
 * cantidades y estado sin
 * crear un registro nuevo.
 */
export const updateEquipment =
  async (req, res) => {
    try {
      const equipmentId =
        Number(
          req.params.id,
        );

      if (
        !Number.isInteger(
          equipmentId,
        ) ||
        equipmentId <= 0
      ) {
        return res.status(400).json({
          success: false,

          error: {
            message:
              "ID de equipamiento inválido",
          },
        });
      }

      /*
       * 1. Validamos el cuerpo
       * igual que al crear.
       *
       * El frontend enviará
       * el formulario completo.
       */
      const validation =
        equipmentSchema.safeParse(
          req.body,
        );

      if (
        !validation.success
      ) {
        return res.status(400).json({
          success: false,

          error: {
            message:
              "Los datos ingresados no son válidos",

            details:
              formatValidationErrors(
                validation.error.issues,
              ),
          },
        });
      }

      const {
        typeId,
        inventoryNumber,
        serialNumber,
        brand,
        model,
        status,
        totalQuantity,
        observations,
      } = validation.data;

      /*
       * 2. Obtenemos el equipo actual.
       */
      const currentEquipment =
        await prisma.equipment.findUnique({
          where: {
            id: equipmentId,
          },

          include: {
            type: true,

            _count: {
              select: {
                assignmentDetails:
                  true,
              },
            },
          },
        });

      if (
        !currentEquipment
      ) {
        return res.status(404).json({
          success: false,

          error: {
            message:
              "Equipamiento no encontrado",
          },
        });
      }

      /*
       * 3. Buscamos el tipo indicado.
       */
      const equipmentType =
        await prisma.equipmentType.findUnique({
          where: {
            id: typeId,
          },
        });

      if (!equipmentType) {
        return res.status(400).json({
          success: false,

          error: {
            message:
              "El tipo de equipamiento seleccionado no existe",

            details: [
              {
                field:
                  "typeId",

                message:
                  "El tipo de equipamiento seleccionado no existe",
              },
            ],
          },
        });
      }

      /*
       * Si el equipo ya tiene
       * historial de asignaciones,
       * no permitimos cambiar
       * su tipo.
       *
       * De lo contrario alteraríamos
       * también la interpretación
       * del historial.
       */
      if (
        currentEquipment._count
          .assignmentDetails >
          0 &&
        typeId !==
          currentEquipment.typeId
      ) {
        return res.status(409).json({
          success: false,

          error: {
            message:
              "No se puede cambiar el tipo de un equipo con historial de asignaciones",

            details: [
              {
                field:
                  "typeId",

                message:
                  "El tipo debe mantenerse porque este equipo ya posee movimientos históricos",
              },
            ],
          },
        });
      }

      /*
       * Si se intenta cambiar
       * a un tipo inactivo,
       * no lo permitimos.
       */
      if (
        !equipmentType.isActive &&
        typeId !==
          currentEquipment.typeId
      ) {
        return res.status(400).json({
          success: false,

          error: {
            message:
              "El tipo de equipamiento seleccionado está inactivo",

            details: [
              {
                field:
                  "typeId",

                message:
                  "Seleccioná un tipo de equipamiento activo",
              },
            ],
          },
        });
      }

      const normalizedInventoryNumber =
        inventoryNumber?.trim() ||
        null;

      const normalizedSerialNumber =
        serialNumber?.trim() ||
        null;

      /*
       * 4. Para INDIVIDUAL,
       * el número de serie es
       * obligatorio.
       */
      if (
        equipmentType.trackingMode ===
          "INDIVIDUAL" &&
        !normalizedSerialNumber
      ) {
        return res.status(400).json({
          success: false,

          error: {
            message:
              "El equipamiento individual necesita un número de serie",

            details: [
              {
                field:
                  "serialNumber",

                message:
                  "Ingresá el número de serie del equipo",
              },
            ],
          },
        });
      }

      /*
       * 5. Controlamos duplicados,
       * excluyendo el propio equipo.
       */
      const duplicateDetails =
        await findDuplicateEquipment({
          inventoryNumber:
            normalizedInventoryNumber,

          serialNumber:
            normalizedSerialNumber,

          excludeId:
            equipmentId,
        });

      if (
        duplicateDetails.length >
        0
      ) {
        return res.status(409).json({
          success: false,

          error: {
            message:
              "Ya existe equipamiento con alguno de los identificadores ingresados",

            details:
              duplicateDetails,
          },
        });
      }

      /*
       * 6. Calculamos cuántas
       * unidades continúan
       * actualmente asignadas.
       */
      const pendingAssignedQuantity =
        await getPendingAssignmentQuantity(
          equipmentId,
        );

      let finalTotalQuantity = 1;
      let finalAvailableQuantity =
        1;
      let finalStatus = status;

      /*
       * EQUIPAMIENTO INDIVIDUAL
       */
      if (
        equipmentType.trackingMode ===
        "INDIVIDUAL"
      ) {
        finalTotalQuantity = 1;

        /*
         * Si está actualmente
         * asignado, el formulario
         * no puede liberarlo.
         *
         * Debe hacerse desde
         * Devoluciones.
         */
        if (
          pendingAssignedQuantity >
          0
        ) {
          if (
            status !==
            "ASIGNADO"
          ) {
            return res.status(409).json({
              success: false,

              error: {
                message:
                  "El equipo posee una asignación activa",

                details: [
                  {
                    field:
                      "status",

                    message:
                      "Para cambiar el estado primero debe registrarse la devolución del equipo",
                  },
                ],
              },
            });
          }

          finalStatus =
            "ASIGNADO";

          finalAvailableQuantity =
            0;
        } else {
          /*
           * Si no tiene asignaciones
           * activas, ASIGNADO no puede
           * establecerse manualmente.
           */
          if (
            status ===
            "ASIGNADO"
          ) {
            return res.status(400).json({
              success: false,

              error: {
                message:
                  "El estado ASIGNADO solo puede establecerse desde Asignaciones",

                details: [
                  {
                    field:
                      "status",

                    message:
                      "Seleccioná otro estado o realizá una asignación desde la ficha del personal",
                  },
                ],
              },
            });
          }

          finalAvailableQuantity =
            status ===
            "DISPONIBLE"
              ? 1
              : 0;
        }
      } else {
        /*
         * EQUIPAMIENTO POR CANTIDAD
         *
         * Ejemplo:
         * Munición 9 mm
         * Cargadores
         */
        finalTotalQuantity =
          totalQuantity;

        /*
         * Nunca permitimos establecer
         * un total inferior a lo que
         * ya se encuentra en poder
         * del personal.
         */
        if (
          finalTotalQuantity <
          pendingAssignedQuantity
        ) {
          return res.status(409).json({
            success: false,

            error: {
              message:
                "La cantidad total no puede ser menor que la cantidad actualmente asignada",

              details: [
                {
                  field:
                    "totalQuantity",

                  message:
                    `Actualmente existen ${pendingAssignedQuantity} unidades asignadas`,
                },
              ],
            },
          });
        }

        if (
          pendingAssignedQuantity >
          0
        ) {
          /*
           * Si existen unidades
           * asignadas, el stock
           * disponible se calcula
           * automáticamente.
           */
          finalAvailableQuantity =
            finalTotalQuantity -
            pendingAssignedQuantity;

          finalStatus =
            finalAvailableQuantity >
            0
              ? "DISPONIBLE"
              : "ASIGNADO";
        } else {
          /*
           * Sin asignaciones activas
           * no permitimos establecer
           * ASIGNADO manualmente.
           */
          if (
            status ===
            "ASIGNADO"
          ) {
            return res.status(400).json({
              success: false,

              error: {
                message:
                  "El estado ASIGNADO solo puede establecerse desde Asignaciones",

                details: [
                  {
                    field:
                      "status",

                    message:
                      "Seleccioná otro estado",
                  },
                ],
              },
            });
          }

          /*
           * Si está disponible,
           * todo el stock queda
           * disponible.
           *
           * Para estados como
           * reparación, custodia
           * o baja, la disponibilidad
           * queda en cero.
           */
          finalAvailableQuantity =
            status ===
            "DISPONIBLE"
              ? finalTotalQuantity
              : 0;
        }
      }

      /*
       * 7. Actualizamos.
       */
      const updatedEquipment =
        await prisma.equipment.update({
          where: {
            id: equipmentId,
          },

          data: {
            typeId,

            inventoryNumber:
              normalizedInventoryNumber,

            serialNumber:
              normalizedSerialNumber,

            brand:
              brand?.trim() ||
              null,

            model:
              model?.trim() ||
              null,

            status:
              finalStatus,

            totalQuantity:
              finalTotalQuantity,

            availableQuantity:
              finalAvailableQuantity,

            observations:
              observations?.trim() ||
              null,
          },

          include: {
            type: true,
          },
        });

      return res.status(200).json({
        success: true,
        data:
          updatedEquipment,
      });
    } catch (error) {
      console.error(
        "Error al actualizar equipamiento:",
        error,
      );

      if (
        error?.code ===
        "P2002"
      ) {
        return res.status(409).json({
          success: false,

          error: {
            message:
              "Ya existe equipamiento con alguno de los identificadores ingresados",
          },
        });
      }

      return res.status(500).json({
        success: false,

        error: {
          message:
            "No se pudo actualizar el equipamiento",
        },
      });
    }
  };