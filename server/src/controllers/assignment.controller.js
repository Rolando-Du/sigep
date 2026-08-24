import prisma from "../lib/prisma.js";

import {
  assignmentSchema,
} from "../schemas/assignment.schema.js";

const formatValidationErrors = (issues) =>
  issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));

const createAssignmentError = (
  message,
  status = 400,
  details = [],
) => {
  const error = new Error(message);

  error.status = status;
  error.details = details;

  return error;
};

const sendControllerError = (
  res,
  error,
  fallbackMessage,
) => {
  if (error?.status) {
    return res.status(error.status).json({
      success: false,
      error: {
        message: error.message,
        details: error.details || [],
      },
    });
  }

  return res.status(500).json({
    success: false,
    error: {
      message: fallbackMessage,
    },
  });
};

const getPersonnelSelect = () => ({
  id: true,
  firstName: true,
  lastName: true,
  fileNumber: true,
  rank: true,
});

const getAssignmentInclude = () => ({
  personnel: {
    select: getPersonnelSelect(),
  },

  details: {
    include: {
      equipment: {
        include: {
          type: true,
        },
      },
    },
  },
});

/*
 * =====================================================
 * HELPERS DE EQUIPAMIENTO
 * =====================================================
 */

const normalizeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .trim()
    .toLowerCase();

/*
 * Determina si el equipo pertenece
 * a la categoría ARMAMENTO.
 */
const isArmamentEquipment = (
  equipment,
) =>
  equipment?.type?.category ===
  "ARMAMENTO";

/*
 * PISTOLA
 *
 * La categoría identifica que es
 * armamento y el nombre específico
 * permite aplicar la dotación:
 *
 * 1 pistola
 * 3 cargadores
 * 50 municiones 9 mm
 */
const isPistolEquipment = (
  equipment,
) => {
  if (
    !isArmamentEquipment(
      equipment,
    )
  ) {
    return false;
  }

  const typeName =
    normalizeText(
      equipment?.type?.name,
    );

  return typeName.includes(
    "pistola",
  );
};

/*
 * CARGADOR
 */
const isMagazineEquipment = (
  equipment,
) => {
  const typeName =
    normalizeText(
      equipment?.type?.name,
    );

  return (
    equipment?.type?.category ===
      "ACCESORIO" &&
    typeName.includes(
      "cargador",
    )
  );
};

/*
 * MUNICIÓN
 */
const isAmmunitionEquipment = (
  equipment,
) => {
  const typeName =
    normalizeText(
      equipment?.type?.name,
    );

  return (
    equipment?.type?.category ===
      "MUNICION" ||
    typeName.includes(
      "municion",
    ) ||
    typeName.includes(
      "cartucho",
    )
  );
};

/*
 * MUNICIÓN 9 MM
 */
const isNineMillimeterAmmunition = (
  equipment,
) => {
  if (
    !isAmmunitionEquipment(
      equipment,
    )
  ) {
    return false;
  }

  const searchableText =
    normalizeText(
      [
        equipment?.type?.name,
        equipment?.type
          ?.description,
        equipment?.brand,
        equipment?.model,
        equipment?.observations,
      ]
        .filter(Boolean)
        .join(" "),
    );

  return (
    searchableText.includes(
      "9 mm",
    ) ||
    searchableText.includes(
      "9mm",
    ) ||
    searchableText.includes(
      "9x19",
    ) ||
    searchableText.includes(
      "9 x 19",
    )
  );
};

const getEquipmentByDetail = (
  equipmentList,
  detail,
) =>
  equipmentList.find(
    (equipment) =>
      equipment.id ===
      detail.equipmentId,
  );

/*
 * Obtiene todas las modalidades
 * predeterminadas presentes en los
 * equipos seleccionados.
 *
 * Ejemplo:
 *
 * Pistola
 * -> PERMANENT
 *
 * Escopeta
 * -> TEMPORARY
 */
const getRequiredAssignmentTypes = (
  equipmentList,
) => [
  ...new Set(
    equipmentList
      .map(
        (equipment) =>
          equipment.type
            ?.defaultAssignmentType,
      )
      .filter(Boolean),
  ),
];

/*
 * =====================================================
 * OBTENER TODAS LAS ASIGNACIONES
 * =====================================================
 */

export const getAssignments = async (
  req,
  res,
) => {
  try {
    const assignments =
      await prisma.assignment.findMany({
        include:
          getAssignmentInclude(),

        orderBy: {
          assignedAt: "desc",
        },
      });

    return res.status(200).json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    console.error(
      "Error al obtener asignaciones:",
      error,
    );

    return res.status(500).json({
      success: false,
      error: {
        message:
          "No se pudieron obtener las asignaciones",
      },
    });
  }
};

/*
 * =====================================================
 * OBTENER ASIGNACIONES DE UNA PERSONA
 * =====================================================
 */

export const getPersonnelAssignments =
  async (req, res) => {
    try {
      const personnelId = Number(
        req.params.personnelId,
      );

      if (
        !Number.isInteger(
          personnelId,
        ) ||
        personnelId <= 0
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error: {
              message:
                "ID de personal inválido",
            },
          });
      }

      const personnel =
        await prisma.personnel.findUnique(
          {
            where: {
              id: personnelId,
            },

            select: {
              id: true,
            },
          },
        );

      if (!personnel) {
        return res
          .status(404)
          .json({
            success: false,
            error: {
              message:
                "Personal no encontrado",
            },
          });
      }

      const assignments =
        await prisma.assignment.findMany(
          {
            where: {
              personnelId,
            },

            include:
              getAssignmentInclude(),

            orderBy: {
              assignedAt:
                "desc",
            },
          },
        );

      return res
        .status(200)
        .json({
          success: true,
          data: assignments,
        });
    } catch (error) {
      console.error(
        "Error al obtener asignaciones del personal:",
        error,
      );

      return res
        .status(500)
        .json({
          success: false,
          error: {
            message:
              "No se pudieron obtener las asignaciones",
          },
        });
    }
  };

/*
 * =====================================================
 * CREAR ASIGNACIÓN
 * =====================================================
 *
 * PERMANENT:
 *
 * El equipamiento queda asignado
 * y permanece en poder del oficial.
 *
 * TEMPORARY:
 *
 * El equipamiento queda asignado
 * al oficial pero permanece
 * habitualmente resguardado en
 * Sala de Armas.
 *
 * No se registran retiros ni
 * entregas diarias.
 */

export const createAssignment = async (
  req,
  res,
) => {
  try {
    const validation =
      assignmentSchema.safeParse(
        req.body,
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
      personnelId,
      type,
      details,
      observations,
    } = validation.data;

    /*
     * Evitamos que un mismo registro
     * de equipamiento aparezca más de
     * una vez dentro de la asignación.
     */
    const equipmentIds =
      details.map(
        (detail) =>
          detail.equipmentId,
      );

    const uniqueEquipmentIds = [
      ...new Set(
        equipmentIds,
      ),
    ];

    if (
      uniqueEquipmentIds.length !==
      equipmentIds.length
    ) {
      return res
        .status(400)
        .json({
          success: false,

          error: {
            message:
              "Hay equipamiento repetido en la asignación",

            details: [
              {
                field:
                  "details",

                message:
                  "Un mismo equipamiento no puede agregarse más de una vez a la misma asignación",
              },
            ],
          },
        });
    }

    const assignment =
      await prisma.$transaction(
        async (tx) => {
          /*
           * ==========================================
           * 1. VERIFICAMOS PERSONAL
           * ==========================================
           */

          const personnel =
            await tx.personnel.findUnique(
              {
                where: {
                  id: personnelId,
                },

                select: {
                  id: true,
                },
              },
            );

          if (!personnel) {
            throw createAssignmentError(
              "Personal no encontrado",
              404,
              [
                {
                  field:
                    "personnelId",

                  message:
                    "La persona seleccionada no existe",
                },
              ],
            );
          }

          /*
           * ==========================================
           * 2. OBTENEMOS TODO EL EQUIPAMIENTO
           * ==========================================
           */

          const equipmentList =
            await tx.equipment.findMany(
              {
                where: {
                  id: {
                    in: uniqueEquipmentIds,
                  },
                },

                include: {
                  type: true,
                },
              },
            );

          if (
            equipmentList.length !==
            uniqueEquipmentIds.length
          ) {
            const foundIds =
              new Set(
                equipmentList.map(
                  (equipment) =>
                    equipment.id,
                ),
              );

            const missingIds =
              uniqueEquipmentIds.filter(
                (id) =>
                  !foundIds.has(
                    id,
                  ),
              );

            throw createAssignmentError(
              "Uno o más equipos no existen",
              404,
              missingIds.map(
                (id) => ({
                  field:
                    "details",

                  message:
                    `No existe el equipamiento con ID ${id}`,
                }),
              ),
            );
          }

          /*
           * ==========================================
           * 3. VALIDAMOS MODALIDAD LOGÍSTICA
           * ==========================================
           *
           * EquipmentType determina la modalidad
           * cuando existe defaultAssignmentType.
           *
           * Pistola:
           * PERMANENT
           *
           * Escopeta:
           * TEMPORARY
           */

          /*
           * Todo ARMAMENTO debe tener
           * modalidad configurada.
           */
          const armamentWithoutDefault =
            equipmentList.find(
              (equipment) =>
                isArmamentEquipment(
                  equipment,
                ) &&
                !equipment.type
                  .defaultAssignmentType,
            );

          if (
            armamentWithoutDefault
          ) {
            throw createAssignmentError(
              "El tipo de armamento no tiene una modalidad configurada",
              409,
              [
                {
                  field:
                    "details",

                  message:
                    `${armamentWithoutDefault.type.name} debe definir una modalidad de asignación antes de poder ser asignado`,
                },
              ],
            );
          }

          /*
           * Obtenemos las modalidades
           * obligatorias presentes.
           */
          const requiredAssignmentTypes =
            getRequiredAssignmentTypes(
              equipmentList,
            );

          /*
           * No pueden mezclarse:
           *
           * PERMANENT + TEMPORARY
           *
           * dentro de una misma asignación.
           */
          if (
            requiredAssignmentTypes.length >
            1
          ) {
            throw createAssignmentError(
              "Los equipos seleccionados requieren modalidades diferentes",
              400,
              [
                {
                  field:
                    "type",

                  message:
                    "No se pueden combinar en una misma asignación equipos configurados como Permanentes y Temporarios",
                },
              ],
            );
          }

          const requiredAssignmentType =
            requiredAssignmentTypes[0] ||
            null;

          /*
           * La modalidad enviada debe
           * coincidir con la definida
           * por el catálogo.
           */
          if (
            requiredAssignmentType &&
            type !==
              requiredAssignmentType
          ) {
            const conflictingEquipment =
              equipmentList.find(
                (equipment) =>
                  equipment.type
                    ?.defaultAssignmentType ===
                  requiredAssignmentType,
              );

            throw createAssignmentError(
              "La modalidad de asignación no coincide con el equipamiento seleccionado",
              400,
              [
                {
                  field:
                    "type",

                  message:
                    `${
                      conflictingEquipment
                        ?.type?.name ||
                      "El equipamiento"
                    } está configurado como ${
                      requiredAssignmentType ===
                      "PERMANENT"
                        ? "Permanente"
                        : "Temporario"
                    }`,
                },
              ],
            );
          }

          /*
           * ==========================================
           * 4. PROVISIÓN PERMANENTE DE PISTOLA
           * ==========================================
           *
           * 1 Pistola
           * 3 Cargadores
           * 50 Municiones 9 mm
           *
           * IMPORTANTE:
           *
           * Esta regla se aplica únicamente
           * a Pistola.
           *
           * Una Escopeta NO recibe esta
           * dotación automática.
           */

          const pistols =
            equipmentList.filter(
              isPistolEquipment,
            );

          if (
            pistols.length > 1
          ) {
            throw createAssignmentError(
              "Solo puede incluirse una pistola por provisión",
              400,
              [
                {
                  field:
                    "details",

                  message:
                    "La provisión permanente debe registrarse con una sola pistola",
                },
              ],
            );
          }

          if (
            pistols.length === 1
          ) {
            const pistol =
              pistols[0];

            /*
             * Pistola siempre PERMANENT.
             */
            if (
              type !==
              "PERMANENT"
            ) {
              throw createAssignmentError(
                "La pistola debe asignarse como Permanente",
                400,
                [
                  {
                    field:
                      "type",

                    message:
                      "La modalidad logística de Pistola es Permanente",
                  },
                ],
              );
            }

            const pistolDetail =
              details.find(
                (detail) =>
                  detail.equipmentId ===
                  pistol.id,
              );

            /*
             * Exactamente una pistola.
             */
            if (
              !pistolDetail ||
              pistolDetail.quantity !==
                1
            ) {
              throw createAssignmentError(
                "Cantidad inválida para la pistola",
                400,
                [
                  {
                    field:
                      "details",

                    message:
                      "La provisión debe incluir exactamente una pistola",
                  },
                ],
              );
            }

            let magazineQuantity = 0;
            let ammunitionQuantity = 0;

            const unrelatedEquipment =
              [];

            /*
             * Clasificamos el resto
             * de los elementos de la
             * asignación.
             */
            details.forEach(
              (detail) => {
                const equipment =
                  getEquipmentByDetail(
                    equipmentList,
                    detail,
                  );

                if (!equipment) {
                  return;
                }

                /*
                 * Pistola.
                 */
                if (
                  isPistolEquipment(
                    equipment,
                  )
                ) {
                  return;
                }

                /*
                 * Cargadores.
                 */
                if (
                  isMagazineEquipment(
                    equipment,
                  )
                ) {
                  magazineQuantity +=
                    detail.quantity;

                  return;
                }

                /*
                 * Munición 9 mm.
                 */
                if (
                  isNineMillimeterAmmunition(
                    equipment,
                  )
                ) {
                  ammunitionQuantity +=
                    detail.quantity;

                  return;
                }

                /*
                 * Todo lo demás queda
                 * fuera de la provisión.
                 */
                unrelatedEquipment.push(
                  equipment,
                );
              },
            );

            /*
             * Una provisión de pistola
             * se registra por separado.
             *
             * No se mezcla con:
             *
             * - Chaleco
             * - Radio
             * - Escopeta
             * - Otros equipos
             */
            if (
              unrelatedEquipment.length >
              0
            ) {
              throw createAssignmentError(
                "La provisión de pistola debe registrarse por separado",
                400,
                [
                  {
                    field:
                      "details",

                    message:
                      "No se pueden incluir chalecos, radios, escopetas u otros equipos dentro de la provisión permanente de pistola",
                  },
                ],
              );
            }

            /*
             * Exactamente 3 cargadores.
             */
            if (
              magazineQuantity !== 3
            ) {
              throw createAssignmentError(
                "La provisión de pistola requiere exactamente 3 cargadores",
                400,
                [
                  {
                    field:
                      "details",

                    message:
                      `Cantidad de cargadores recibida: ${magazineQuantity}. Cantidad requerida: 3`,
                  },
                ],
              );
            }

            /*
             * Exactamente 50 municiones 9 mm.
             */
            if (
              ammunitionQuantity !==
              50
            ) {
              throw createAssignmentError(
                "La provisión de pistola requiere exactamente 50 municiones 9 mm",
                400,
                [
                  {
                    field:
                      "details",

                    message:
                      `Cantidad de municiones 9 mm recibida: ${ammunitionQuantity}. Cantidad requerida: 50`,
                  },
                ],
              );
            }
          }

          /*
           * ==========================================
           * 5. VALIDAMOS Y RESERVAMOS EQUIPAMIENTO
           * ==========================================
           */

          for (
            const detail of details
          ) {
            const equipment =
              equipmentList.find(
                (item) =>
                  item.id ===
                  detail.equipmentId,
              );

            /*
             * El tipo de equipamiento
             * debe estar activo.
             */
            if (
              !equipment.type
                .isActive
            ) {
              throw createAssignmentError(
                "El tipo de equipamiento no está activo",
                400,
                [
                  {
                    field:
                      "details",

                    message:
                      `${equipment.type.name} no se encuentra habilitado para nuevas asignaciones`,
                  },
                ],
              );
            }

            /*
             * =====================================
             * EQUIPAMIENTO INDIVIDUAL
             * =====================================
             *
             * Ejemplos:
             *
             * - Pistola
             * - Escopeta
             * - Chaleco
             * - Radio
             */

            if (
              equipment.type
                .trackingMode ===
              "INDIVIDUAL"
            ) {
              /*
               * Un equipo individual
               * siempre se asigna de a 1.
               */
              if (
                detail.quantity !== 1
              ) {
                throw createAssignmentError(
                  "Cantidad inválida para equipamiento individual",
                  400,
                  [
                    {
                      field:
                        "details",

                      message:
                        `${equipment.type.name} es un equipo individual y solo puede asignarse una unidad`,
                    },
                  ],
                );
              }

              /*
               * Debe estar disponible.
               */
              if (
                equipment.status !==
                  "DISPONIBLE" ||
                equipment
                  .availableQuantity <
                  1
              ) {
                throw createAssignmentError(
                  "El equipamiento no está disponible",
                  409,
                  [
                    {
                      field:
                        "details",

                      message:
                        `${
                          equipment.type
                            .name
                        }${
                          equipment.serialNumber
                            ? ` - Serie ${equipment.serialNumber}`
                            : ""
                        } no está disponible`,
                    },
                  ],
                );
              }

              /*
               * Reserva atómica.
               *
               * Evita que dos operaciones
               * puedan asignar al mismo
               * tiempo el mismo equipo.
               */
              const updated =
                await tx.equipment.updateMany(
                  {
                    where: {
                      id:
                        equipment.id,

                      status:
                        "DISPONIBLE",

                      availableQuantity:
                        {
                          gte: 1,
                        },
                    },

                    data: {
                      availableQuantity:
                        {
                          decrement:
                            1,
                        },

                      status:
                        "ASIGNADO",
                    },
                  },
                );

              if (
                updated.count !== 1
              ) {
                throw createAssignmentError(
                  "El equipamiento dejó de estar disponible",
                  409,
                  [
                    {
                      field:
                        "details",

                      message:
                        `${equipment.type.name} fue asignado por otra operación`,
                    },
                  ],
                );
              }

              continue;
            }

            /*
             * =====================================
             * EQUIPAMIENTO POR CANTIDAD
             * =====================================
             *
             * Ejemplos:
             *
             * - Cargadores
             * - Municiones
             */

            if (
              equipment.type
                .trackingMode ===
              "QUANTITY"
            ) {
              /*
               * El registro debe permitir
               * nuevas asignaciones.
               */
              if (
                equipment.status !==
                "DISPONIBLE"
              ) {
                throw createAssignmentError(
                  "El equipamiento no está disponible",
                  409,
                  [
                    {
                      field:
                        "details",

                      message:
                        `${equipment.type.name} no se encuentra disponible`,
                    },
                  ],
                );
              }

              /*
               * Verificamos stock.
               */
              if (
                equipment
                  .availableQuantity <
                detail.quantity
              ) {
                throw createAssignmentError(
                  "Stock insuficiente",
                  409,
                  [
                    {
                      field:
                        "details",

                      message:
                        `Stock insuficiente de ${equipment.type.name}. Disponible: ${equipment.availableQuantity}`,
                    },
                  ],
                );
              }

              /*
               * Descontamos stock
               * de forma atómica.
               */
              const updated =
                await tx.equipment.updateMany(
                  {
                    where: {
                      id:
                        equipment.id,

                      status:
                        "DISPONIBLE",

                      availableQuantity:
                        {
                          gte:
                            detail.quantity,
                        },
                    },

                    data: {
                      availableQuantity:
                        {
                          decrement:
                            detail.quantity,
                        },
                    },
                  },
                );

              if (
                updated.count !== 1
              ) {
                throw createAssignmentError(
                  "El stock cambió durante la asignación",
                  409,
                  [
                    {
                      field:
                        "details",

                      message:
                        `Ya no existe stock suficiente de ${equipment.type.name}`,
                    },
                  ],
                );
              }

              /*
               * Verificamos cuánto stock
               * quedó disponible.
               */
              const updatedEquipment =
                await tx.equipment.findUnique(
                  {
                    where: {
                      id:
                        equipment.id,
                    },

                    select: {
                      availableQuantity:
                        true,
                    },
                  },
                );

              /*
               * Si queda stock 0:
               *
               * ASIGNADO
               *
               * Si todavía hay unidades:
               *
               * DISPONIBLE
               */
              if (
                updatedEquipment
                  .availableQuantity ===
                0
              ) {
                await tx.equipment.update(
                  {
                    where: {
                      id:
                        equipment.id,
                    },

                    data: {
                      status:
                        "ASIGNADO",
                    },
                  },
                );
              }
            }
          }

          /*
           * ==========================================
           * 6. CREAMOS LA ASIGNACIÓN
           * ==========================================
           *
           * PERMANENT
           * -> En poder del oficial
           *
           * TEMPORARY
           * -> Sala de Armas
           *
           * No existe physicalStatus.
           */

          return tx.assignment.create({
            data: {
              personnelId,

              type,

              status:
                "ACTIVE",

              observations:
                observations ||
                null,

              details: {
                create:
                  details.map(
                    (detail) => ({
                      equipmentId:
                        detail.equipmentId,

                      quantity:
                        detail.quantity,

                      returnedQuantity:
                        0,
                    }),
                  ),
              },
            },

            include:
              getAssignmentInclude(),
          });
        },
      );

    return res.status(201).json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    console.error(
      "Error al crear asignación:",
      error,
    );

    return sendControllerError(
      res,
      error,
      "No se pudo registrar la asignación",
    );
  }
};

/*
 * =====================================================
 * DEVOLUCIÓN DEFINITIVA
 * =====================================================
 *
 * Esta operación significa que
 * el equipamiento deja de estar
 * asignado al personal.
 *
 * No representa una entrega diaria
 * en Sala de Armas.
 *
 * INDIVIDUAL:
 * devuelve una unidad.
 *
 * QUANTITY:
 * permite devolución parcial.
 */

export const returnAssignmentDetail =
  async (req, res) => {
    try {
      const assignmentId =
        Number(
          req.params
            .assignmentId,
        );

      const detailId =
        Number(
          req.params.detailId,
        );

      const returnQuantity =
        Number(
          req.body.quantity,
        );

      /*
       * VALIDAMOS ID DE ASIGNACIÓN
       */
      if (
        !Number.isInteger(
          assignmentId,
        ) ||
        assignmentId <= 0
      ) {
        return res
          .status(400)
          .json({
            success: false,

            error: {
              message:
                "ID de asignación inválido",
            },
          });
      }

      /*
       * VALIDAMOS ID DEL DETALLE
       */
      if (
        !Number.isInteger(
          detailId,
        ) ||
        detailId <= 0
      ) {
        return res
          .status(400)
          .json({
            success: false,

            error: {
              message:
                "ID de detalle inválido",
            },
          });
      }

      /*
       * VALIDAMOS CANTIDAD
       */
      if (
        !Number.isInteger(
          returnQuantity,
        ) ||
        returnQuantity <= 0
      ) {
        return res
          .status(400)
          .json({
            success: false,

            error: {
              message:
                "La cantidad a devolver no es válida",

              details: [
                {
                  field:
                    "quantity",

                  message:
                    "La cantidad debe ser un número entero mayor a cero",
                },
              ],
            },
          });
      }

      const updatedAssignment =
        await prisma.$transaction(
          async (tx) => {
            /*
             * =====================================
             * 1. VERIFICAMOS ASIGNACIÓN
             * =====================================
             */

            const assignment =
              await tx.assignment.findUnique(
                {
                  where: {
                    id:
                      assignmentId,
                  },

                  select: {
                    id: true,
                    status: true,
                  },
                },
              );

            if (!assignment) {
              throw createAssignmentError(
                "Asignación no encontrada",
                404,
              );
            }

            /*
             * Solo una asignación activa
             * puede recibir devoluciones.
             */
            if (
              assignment.status !==
              "ACTIVE"
            ) {
              throw createAssignmentError(
                "La asignación no se encuentra activa",
                409,
                [
                  {
                    field:
                      "assignment",

                    message:
                      "Solo se pueden devolver elementos de una asignación activa",
                  },
                ],
              );
            }

            /*
             * =====================================
             * 2. BUSCAMOS EL DETALLE
             * =====================================
             */

            const detail =
              await tx.assignmentDetail.findFirst(
                {
                  where: {
                    id:
                      detailId,

                    assignmentId,
                  },

                  include: {
                    equipment: {
                      include: {
                        type: true,
                      },
                    },
                  },
                },
              );

            if (!detail) {
              throw createAssignmentError(
                "El equipamiento no pertenece a esta asignación",
                404,
              );
            }

            const equipment =
              detail.equipment;

            /*
             * Cantidad todavía asignada.
             */
            const pendingQuantity =
              detail.quantity -
              detail.returnedQuantity;

            /*
             * Ya fue devuelto completamente.
             */
            if (
              pendingQuantity <=
              0
            ) {
              throw createAssignmentError(
                "El equipamiento ya fue devuelto",
                409,
                [
                  {
                    field:
                      "quantity",

                    message:
                      "Este elemento ya fue devuelto completamente",
                  },
                ],
              );
            }

            /*
             * No permitimos devolver
             * más de lo asignado.
             */
            if (
              returnQuantity >
              pendingQuantity
            ) {
              throw createAssignmentError(
                "La cantidad a devolver supera la cantidad asignada",
                400,
                [
                  {
                    field:
                      "quantity",

                    message:
                      `Cantidad pendiente de devolución: ${pendingQuantity}`,
                  },
                ],
              );
            }

            /*
             * Equipamiento individual:
             * siempre se devuelve 1.
             */
            if (
              equipment.type
                .trackingMode ===
                "INDIVIDUAL" &&
              returnQuantity !==
                1
            ) {
              throw createAssignmentError(
                "Cantidad inválida para equipamiento individual",
                400,
                [
                  {
                    field:
                      "quantity",

                    message:
                      `${equipment.type.name} es un equipo individual y debe devolverse una unidad`,
                  },
                ],
              );
            }

            /*
             * Evitamos superar
             * el stock total.
             */
            const newAvailableQuantity =
              equipment
                .availableQuantity +
              returnQuantity;

            if (
              newAvailableQuantity >
              equipment.totalQuantity
            ) {
              throw createAssignmentError(
                "La devolución produciría un stock inválido",
                409,
                [
                  {
                    field:
                      "quantity",

                    message:
                      "La cantidad disponible no puede superar el stock total",
                  },
                ],
              );
            }

            /*
             * =====================================
             * 3. ACTUALIZAMOS EL DETALLE
             * =====================================
             */

            const updatedDetail =
              await tx.assignmentDetail.updateMany(
                {
                  where: {
                    id:
                      detail.id,

                    returnedQuantity:
                      detail.returnedQuantity,
                  },

                  data: {
                    returnedQuantity:
                      {
                        increment:
                          returnQuantity,
                      },
                  },
                },
              );

            /*
             * Control optimista.
             */
            if (
              updatedDetail.count !==
              1
            ) {
              throw createAssignmentError(
                "La devolución no pudo completarse",
                409,
                [
                  {
                    field:
                      "quantity",

                    message:
                      "El estado de la asignación cambió durante la operación",
                  },
                ],
              );
            }

            /*
             * =====================================
             * 4. REINCORPORAMOS STOCK
             * =====================================
             */

            const updatedEquipment =
              await tx.equipment.updateMany(
                {
                  where: {
                    id:
                      equipment.id,

                    availableQuantity:
                      equipment
                        .availableQuantity,
                  },

                  data: {
                    availableQuantity:
                      {
                        increment:
                          returnQuantity,
                      },

                    /*
                     * Al existir nuevamente
                     * disponibilidad vuelve
                     * a DISPONIBLE.
                     */
                    status:
                      "DISPONIBLE",
                  },
                },
              );

            if (
              updatedEquipment.count !==
              1
            ) {
              throw createAssignmentError(
                "El stock cambió durante la devolución",
                409,
                [
                  {
                    field:
                      "quantity",

                    message:
                      "No se pudo actualizar el stock del equipamiento",
                  },
                ],
              );
            }

            /*
             * =====================================
             * 5. VERIFICAMOS SI TODO FUE DEVUELTO
             * =====================================
             */

            const assignmentDetails =
              await tx.assignmentDetail.findMany(
                {
                  where: {
                    assignmentId,
                  },

                  select: {
                    quantity: true,

                    returnedQuantity:
                      true,
                  },
                },
              );

            const fullyReturned =
              assignmentDetails.every(
                (item) =>
                  item.returnedQuantity >=
                  item.quantity,
              );

            /*
             * Si todos los elementos
             * fueron devueltos:
             *
             * ACTIVE
             * ↓
             * RETURNED
             */
            if (
              fullyReturned
            ) {
              await tx.assignment.update(
                {
                  where: {
                    id:
                      assignmentId,
                  },

                  data: {
                    status:
                      "RETURNED",

                    returnedAt:
                      new Date(),
                  },
                },
              );
            }

            /*
             * =====================================
             * 6. DEVOLVEMOS ASIGNACIÓN ACTUALIZADA
             * =====================================
             */

            return tx.assignment.findUnique(
              {
                where: {
                  id:
                    assignmentId,
                },

                include:
                  getAssignmentInclude(),
              },
            );
          },
        );

      return res
        .status(200)
        .json({
          success: true,
          data:
            updatedAssignment,
        });
    } catch (error) {
      console.error(
        "Error al devolver equipamiento:",
        error,
      );

      return sendControllerError(
        res,
        error,
        "No se pudo registrar la devolución",
      );
    }
  };