import prisma from "../lib/prisma.js";
import { assignmentSchema } from "../schemas/assignment.schema.js";

// VALIDACIÓN
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

// INCLUDES
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

// HELPERS
const normalizeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const isArmamentEquipment = (equipment) =>
  equipment?.type?.category === "ARMAMENTO";

const isPistolEquipment = (equipment) => {
  if (!isArmamentEquipment(equipment)) {
    return false;
  }

  return normalizeText(
    equipment?.type?.name,
  ).includes("pistola");
};

const isBallisticVestEquipment = (
  equipment,
) => {
  const typeName = normalizeText(
    equipment?.type?.name,
  );

  return (
    equipment?.type?.category ===
      "PROTECCION" &&
    typeName.includes("chaleco")
  );
};

const isShotgunEquipment = (equipment) => {
  if (!isArmamentEquipment(equipment)) {
    return false;
  }

  return normalizeText(
    equipment?.type?.name,
  ).includes("escopeta");
};

const isMagazineEquipment = (equipment) => {
  const typeName = normalizeText(
    equipment?.type?.name,
  );

  return (
    equipment?.type?.category === "ACCESORIO" &&
    typeName.includes("cargador")
  );
};

const isAmmunitionEquipment = (equipment) => {
  const typeName = normalizeText(
    equipment?.type?.name,
  );

  return (
    equipment?.type?.category === "MUNICION" ||
    typeName.includes("municion") ||
    typeName.includes("cartucho")
  );
};

const isNineMillimeterAmmunition = (
  equipment,
) => {
  if (!isAmmunitionEquipment(equipment)) {
    return false;
  }

  const searchableText = normalizeText(
    [
      equipment?.type?.name,
      equipment?.type?.description,
      equipment?.brand,
      equipment?.model,
      equipment?.observations,
    ]
      .filter(Boolean)
      .join(" "),
  );

  return (
    searchableText.includes("9 mm") ||
    searchableText.includes("9mm") ||
    searchableText.includes("9x19") ||
    searchableText.includes("9 x 19")
  );
};

const getEquipmentByDetail = (
  equipmentList,
  detail,
) =>
  equipmentList.find(
    (equipment) =>
      equipment.id === detail.equipmentId,
  );

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

// LISTAR ASIGNACIONES
export const getAssignments = async (
  req,
  res,
) => {
  try {
    const assignments =
      await prisma.assignment.findMany({
        include: getAssignmentInclude(),
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

// LISTAR ASIGNACIONES DEL PERSONAL
export const getPersonnelAssignments =
  async (req, res) => {
    try {
      const personnelId = Number(
        req.params.personnelId,
      );

      if (
        !Number.isInteger(personnelId) ||
        personnelId <= 0
      ) {
        return res.status(400).json({
          success: false,
          error: {
            message:
              "ID de personal inválido",
          },
        });
      }

      const personnel =
        await prisma.personnel.findUnique({
          where: {
            id: personnelId,
          },
          select: {
            id: true,
          },
        });

      if (!personnel) {
        return res.status(404).json({
          success: false,
          error: {
            message:
              "Personal no encontrado",
          },
        });
      }

      const assignments =
        await prisma.assignment.findMany({
          where: {
            personnelId,
          },
          include: getAssignmentInclude(),
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
        "Error al obtener asignaciones del personal:",
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

// CREAR ASIGNACIÓN
export const createAssignment = async (
  req,
  res,
) => {
  try {
    const validation =
      assignmentSchema.safeParse(req.body);

    if (!validation.success) {
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
      personnelId,
      type,
      details,
      observations,
    } = validation.data;

    const equipmentIds = details.map(
      (detail) => detail.equipmentId,
    );

    const uniqueEquipmentIds = [
      ...new Set(equipmentIds),
    ];

    if (
      uniqueEquipmentIds.length !==
      equipmentIds.length
    ) {
      return res.status(400).json({
        success: false,
        error: {
          message:
            "Hay equipamiento repetido en la asignación",
          details: [
            {
              field: "details",
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
          // PERSONAL
          const personnel =
            await tx.personnel.findUnique({
              where: {
                id: personnelId,
              },
              select: {
                id: true,
              },
            });

          if (!personnel) {
            throw createAssignmentError(
              "Personal no encontrado",
              404,
              [
                {
                  field: "personnelId",
                  message:
                    "La persona seleccionada no existe",
                },
              ],
            );
          }

          // EQUIPAMIENTO
          const equipmentList =
            await tx.equipment.findMany({
              where: {
                id: {
                  in: uniqueEquipmentIds,
                },
              },
              include: {
                type: true,
              },
            });

          if (
            equipmentList.length !==
            uniqueEquipmentIds.length
          ) {
            const foundIds = new Set(
              equipmentList.map(
                (equipment) => equipment.id,
              ),
            );

            const missingIds =
              uniqueEquipmentIds.filter(
                (id) => !foundIds.has(id),
              );

            throw createAssignmentError(
              "Uno o más equipos no existen",
              404,
              missingIds.map((id) => ({
                field: "details",
                message:
                  `No existe el equipamiento con ID ${id}`,
              })),
            );
          }

          // EQUIPAMIENTO ASIGNABLE
          const pistols =
            equipmentList.filter(
              isPistolEquipment,
            );

          const ballisticVests =
            equipmentList.filter(
              isBallisticVestEquipment,
            );

          if (pistols.length === 0) {
            const nonAssignableEquipment =
              equipmentList.find(
                (equipment) =>
                  !isBallisticVestEquipment(
                    equipment,
                  ),
              );

            if (nonAssignableEquipment) {
              throw createAssignmentError(
                "El equipamiento seleccionado se administra como stock general",
                400,
                [
                  {
                    field: "details",
                    message:
                      `${nonAssignableEquipment.type.name} no puede asignarse directamente al personal. Solo Pistola y Chaleco Balístico son asignables.`,
                  },
                ],
              );
            }

            if (
              ballisticVests.length > 0 &&
              type !== "TEMPORARY"
            ) {
              throw createAssignmentError(
                "El chaleco balístico debe asignarse como Temporario",
                400,
                [
                  {
                    field: "type",
                    message:
                      "La modalidad logística del Chaleco Balístico es Temporaria",
                  },
                ],
              );
            }

            const invalidVestConfiguration =
              ballisticVests.find(
                (equipment) =>
                  equipment.type
                    ?.defaultAssignmentType !==
                  "TEMPORARY",
              );

            if (
              invalidVestConfiguration
            ) {
              throw createAssignmentError(
                "El tipo Chaleco Balístico está configurado incorrectamente",
                409,
                [
                  {
                    field: "details",
                    message:
                      `${invalidVestConfiguration.type.name} debe tener modalidad Temporaria`,
                  },
                ],
              );
            }
          }

          // MODALIDAD
          const armamentWithoutDefault =
            equipmentList.find(
              (equipment) =>
                isArmamentEquipment(
                  equipment,
                ) &&
                !equipment.type
                  .defaultAssignmentType,
            );

          if (armamentWithoutDefault) {
            throw createAssignmentError(
              "El tipo de armamento no tiene una modalidad configurada",
              409,
              [
                {
                  field: "details",
                  message:
                    `${armamentWithoutDefault.type.name} debe definir una modalidad de asignación antes de poder ser asignado`,
                },
              ],
            );
          }

          const requiredAssignmentTypes =
            getRequiredAssignmentTypes(
              equipmentList,
            );

          if (
            requiredAssignmentTypes.length > 1
          ) {
            throw createAssignmentError(
              "Los equipos seleccionados requieren modalidades diferentes",
              400,
              [
                {
                  field: "type",
                  message:
                    "No se pueden combinar equipos configurados como Permanentes y Temporarios en una misma asignación",
                },
              ],
            );
          }

          const requiredAssignmentType =
            requiredAssignmentTypes[0] ||
            null;

          if (
            requiredAssignmentType &&
            type !== requiredAssignmentType
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
                  field: "type",
                  message:
                    `${
                      conflictingEquipment?.type
                        ?.name ||
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

          // EQUIPAMIENTO SOLO DE STOCK
          const shotgun =
            equipmentList.find(
              isShotgunEquipment,
            );

          if (shotgun) {
            throw createAssignmentError(
              "La escopeta se administra como stock general",
              400,
              [
                {
                  field: "details",
                  message:
                    "La escopeta no forma parte de la dotación logística individual del personal",
                },
              ],
            );
          }

          const nonNineMillimeterAmmunition =
            equipmentList.find(
              (equipment) =>
                isAmmunitionEquipment(
                  equipment,
                ) &&
                !isNineMillimeterAmmunition(
                  equipment,
                ),
            );

          if (
            nonNineMillimeterAmmunition
          ) {
            throw createAssignmentError(
              "La munición seleccionada se administra como stock general",
              400,
              [
                {
                  field: "details",
                  message:
                    `${nonNineMillimeterAmmunition.type.name} no se asigna directamente al personal`,
                },
              ],
            );
          }

          // PROVISIÓN DE PISTOLA
          if (pistols.length > 1) {
            throw createAssignmentError(
              "Solo puede incluirse una pistola por provisión",
              400,
              [
                {
                  field: "details",
                  message:
                    "La provisión debe registrarse con una sola pistola",
                },
              ],
            );
          }

          const magazines =
            equipmentList.filter(
              isMagazineEquipment,
            );

          const nineMillimeterAmmunition =
            equipmentList.filter(
              isNineMillimeterAmmunition,
            );

          if (pistols.length === 0) {
            if (magazines.length > 0) {
              throw createAssignmentError(
                "Los cargadores solo pueden asignarse con una pistola",
                400,
                [
                  {
                    field: "details",
                    message:
                      "Los cargadores forman parte de la dotación de la pistola y no se asignan por separado",
                  },
                ],
              );
            }

            if (
              nineMillimeterAmmunition.length >
              0
            ) {
              throw createAssignmentError(
                "La munición 9 mm solo puede asignarse con una pistola",
                400,
                [
                  {
                    field: "details",
                    message:
                      "El stock excedente de munición 9 mm no se asigna directamente al personal",
                  },
                ],
              );
            }
          }

          if (pistols.length === 1) {
            const pistol = pistols[0];

            if (type !== "PERMANENT") {
              throw createAssignmentError(
                "La pistola debe asignarse como Permanente",
                400,
                [
                  {
                    field: "type",
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

            if (
              !pistolDetail ||
              pistolDetail.quantity !== 1
            ) {
              throw createAssignmentError(
                "Cantidad inválida para la pistola",
                400,
                [
                  {
                    field: "details",
                    message:
                      "La provisión debe incluir exactamente una pistola",
                  },
                ],
              );
            }

            let magazineQuantity = 0;
            let ammunitionQuantity = 0;
            const unrelatedEquipment = [];

            details.forEach((detail) => {
              const equipment =
                getEquipmentByDetail(
                  equipmentList,
                  detail,
                );

              if (!equipment) {
                return;
              }

              if (
                isPistolEquipment(
                  equipment,
                )
              ) {
                return;
              }

              if (
                isMagazineEquipment(
                  equipment,
                )
              ) {
                magazineQuantity +=
                  detail.quantity;
                return;
              }

              if (
                isNineMillimeterAmmunition(
                  equipment,
                )
              ) {
                ammunitionQuantity +=
                  detail.quantity;
                return;
              }

              unrelatedEquipment.push(
                equipment,
              );
            });

            if (
              unrelatedEquipment.length > 0
            ) {
              throw createAssignmentError(
                "La provisión de pistola debe registrarse por separado",
                400,
                [
                  {
                    field: "details",
                    message:
                      "La provisión de pistola solo puede incluir 1 pistola, 3 cargadores y 50 municiones 9 mm",
                  },
                ],
              );
            }

            if (
              magazineQuantity !== 3
            ) {
              throw createAssignmentError(
                "La provisión de pistola requiere exactamente 3 cargadores",
                400,
                [
                  {
                    field: "details",
                    message:
                      `Cantidad de cargadores recibida: ${magazineQuantity}. Cantidad requerida: 3`,
                  },
                ],
              );
            }

            if (
              ammunitionQuantity !== 50
            ) {
              throw createAssignmentError(
                "La provisión de pistola requiere exactamente 50 municiones 9 mm",
                400,
                [
                  {
                    field: "details",
                    message:
                      `Cantidad de municiones 9 mm recibida: ${ammunitionQuantity}. Cantidad requerida: 50`,
                  },
                ],
              );
            }
          }

          // RESERVAR EQUIPAMIENTO
          for (const detail of details) {
            const equipment =
              equipmentList.find(
                (item) =>
                  item.id ===
                  detail.equipmentId,
              );

            if (!equipment.type.isActive) {
              throw createAssignmentError(
                "El tipo de equipamiento no está activo",
                400,
                [
                  {
                    field: "details",
                    message:
                      `${equipment.type.name} no se encuentra habilitado para nuevas asignaciones`,
                  },
                ],
              );
            }

            if (
              equipment.type
                .trackingMode ===
              "INDIVIDUAL"
            ) {
              if (detail.quantity !== 1) {
                throw createAssignmentError(
                  "Cantidad inválida para equipamiento individual",
                  400,
                  [
                    {
                      field: "details",
                      message:
                        `${equipment.type.name} es un equipo individual y solo puede asignarse una unidad`,
                    },
                  ],
                );
              }

              if (
                equipment.status !==
                  "DISPONIBLE" ||
                equipment.availableQuantity <
                  1
              ) {
                throw createAssignmentError(
                  "El equipamiento no está disponible",
                  409,
                  [
                    {
                      field: "details",
                      message:
                        `${equipment.type.name}${
                          equipment.serialNumber
                            ? ` - Serie ${equipment.serialNumber}`
                            : ""
                        } no está disponible`,
                    },
                  ],
                );
              }

              const updated =
                await tx.equipment.updateMany(
                  {
                    where: {
                      id: equipment.id,
                      status:
                        "DISPONIBLE",
                      availableQuantity: {
                        gte: 1,
                      },
                    },
                    data: {
                      availableQuantity: {
                        decrement: 1,
                      },
                      status: "ASIGNADO",
                    },
                  },
                );

              if (updated.count !== 1) {
                throw createAssignmentError(
                  "El equipamiento dejó de estar disponible",
                  409,
                  [
                    {
                      field: "details",
                      message:
                        `${equipment.type.name} fue asignado por otra operación`,
                    },
                  ],
                );
              }

              continue;
            }

            if (
              equipment.type
                .trackingMode ===
              "QUANTITY"
            ) {
              if (
                equipment.status !==
                "DISPONIBLE"
              ) {
                throw createAssignmentError(
                  "El equipamiento no está disponible",
                  409,
                  [
                    {
                      field: "details",
                      message:
                        `${equipment.type.name} no se encuentra disponible`,
                    },
                  ],
                );
              }

              if (
                equipment.availableQuantity <
                detail.quantity
              ) {
                throw createAssignmentError(
                  "Stock insuficiente",
                  409,
                  [
                    {
                      field: "details",
                      message:
                        `Stock insuficiente de ${equipment.type.name}. Disponible: ${equipment.availableQuantity}`,
                    },
                  ],
                );
              }

              const updated =
                await tx.equipment.updateMany(
                  {
                    where: {
                      id: equipment.id,
                      status:
                        "DISPONIBLE",
                      availableQuantity: {
                        gte:
                          detail.quantity,
                      },
                    },
                    data: {
                      availableQuantity: {
                        decrement:
                          detail.quantity,
                      },
                    },
                  },
                );

              if (updated.count !== 1) {
                throw createAssignmentError(
                  "El stock cambió durante la asignación",
                  409,
                  [
                    {
                      field: "details",
                      message:
                        `Ya no existe stock suficiente de ${equipment.type.name}`,
                    },
                  ],
                );
              }

              const updatedEquipment =
                await tx.equipment.findUnique(
                  {
                    where: {
                      id: equipment.id,
                    },
                    select: {
                      availableQuantity:
                        true,
                    },
                  },
                );

              if (
                updatedEquipment
                  .availableQuantity === 0
              ) {
                await tx.equipment.update(
                  {
                    where: {
                      id: equipment.id,
                    },
                    data: {
                      status: "ASIGNADO",
                    },
                  },
                );
              }
            }
          }

          // GUARDAR ASIGNACIÓN
          return tx.assignment.create({
            data: {
              personnelId,
              type,
              status: "ACTIVE",
              observations:
                observations || null,
              details: {
                create: details.map(
                  (detail) => ({
                    equipmentId:
                      detail.equipmentId,
                    quantity:
                      detail.quantity,
                    returnedQuantity: 0,
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

// DEVOLUCIÓN DEFINITIVA
export const returnAssignmentDetail =
  async (req, res) => {
    try {
      const assignmentId = Number(
        req.params.assignmentId,
      );

      const detailId = Number(
        req.params.detailId,
      );

      const returnQuantity = Number(
        req.body.quantity,
      );

      if (
        !Number.isInteger(assignmentId) ||
        assignmentId <= 0
      ) {
        return res.status(400).json({
          success: false,
          error: {
            message:
              "ID de asignación inválido",
          },
        });
      }

      if (
        !Number.isInteger(detailId) ||
        detailId <= 0
      ) {
        return res.status(400).json({
          success: false,
          error: {
            message:
              "ID de detalle inválido",
          },
        });
      }

      if (
        !Number.isInteger(
          returnQuantity,
        ) ||
        returnQuantity <= 0
      ) {
        return res.status(400).json({
          success: false,
          error: {
            message:
              "La cantidad a devolver no es válida",
            details: [
              {
                field: "quantity",
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
            // ASIGNACIÓN
            const assignment =
              await tx.assignment.findUnique(
                {
                  where: {
                    id: assignmentId,
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

            // DETALLE
            const detail =
              await tx.assignmentDetail.findFirst(
                {
                  where: {
                    id: detailId,
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

            const pendingQuantity =
              detail.quantity -
              detail.returnedQuantity;

            if (
              pendingQuantity <= 0
            ) {
              throw createAssignmentError(
                "El equipamiento ya fue devuelto",
                409,
                [
                  {
                    field: "quantity",
                    message:
                      "Este elemento ya fue devuelto completamente",
                  },
                ],
              );
            }

            if (
              returnQuantity >
              pendingQuantity
            ) {
              throw createAssignmentError(
                "La cantidad a devolver supera la cantidad asignada",
                400,
                [
                  {
                    field: "quantity",
                    message:
                      `Cantidad pendiente de devolución: ${pendingQuantity}`,
                  },
                ],
              );
            }

            if (
              equipment.type
                .trackingMode ===
                "INDIVIDUAL" &&
              returnQuantity !== 1
            ) {
              throw createAssignmentError(
                "Cantidad inválida para equipamiento individual",
                400,
                [
                  {
                    field: "quantity",
                    message:
                      `${equipment.type.name} es un equipo individual y debe devolverse una unidad`,
                  },
                ],
              );
            }

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
                    field: "quantity",
                    message:
                      "La cantidad disponible no puede superar el stock total",
                  },
                ],
              );
            }

            // ACTUALIZAR DETALLE
            const updatedDetail =
              await tx.assignmentDetail.updateMany(
                {
                  where: {
                    id: detail.id,
                    returnedQuantity:
                      detail.returnedQuantity,
                  },
                  data: {
                    returnedQuantity: {
                      increment:
                        returnQuantity,
                    },
                  },
                },
              );

            if (
              updatedDetail.count !== 1
            ) {
              throw createAssignmentError(
                "La devolución no pudo completarse",
                409,
                [
                  {
                    field: "quantity",
                    message:
                      "El estado de la asignación cambió durante la operación",
                  },
                ],
              );
            }

            // REINCORPORAR STOCK
            const updatedEquipment =
              await tx.equipment.updateMany(
                {
                  where: {
                    id: equipment.id,
                    availableQuantity:
                      equipment
                        .availableQuantity,
                  },
                  data: {
                    availableQuantity: {
                      increment:
                        returnQuantity,
                    },
                    status:
                      "DISPONIBLE",
                  },
                },
              );

            if (
              updatedEquipment.count !== 1
            ) {
              throw createAssignmentError(
                "El stock cambió durante la devolución",
                409,
                [
                  {
                    field: "quantity",
                    message:
                      "No se pudo actualizar el stock del equipamiento",
                  },
                ],
              );
            }

            // CERRAR ASIGNACIÓN
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

            if (fullyReturned) {
              await tx.assignment.update(
                {
                  where: {
                    id: assignmentId,
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

            return tx.assignment.findUnique(
              {
                where: {
                  id: assignmentId,
                },
                include:
                  getAssignmentInclude(),
              },
            );
          },
        );

      return res.status(200).json({
        success: true,
        data: updatedAssignment,
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

// DEVOLUCIÓN DE PROVISIÓN DE PISTOLA
export const returnPistolProvision = async (
  req,
  res,
) => {
  try {
    const assignmentId = Number(
      req.params.assignmentId,
    );

    if (
      !Number.isInteger(assignmentId) ||
      assignmentId <= 0
    ) {
      return res.status(400).json({
        success: false,
        error: {
          message:
            "ID de asignación inválido",
        },
      });
    }

    const updatedAssignment =
      await prisma.$transaction(
        async (tx) => {
          const assignment =
            await tx.assignment.findUnique({
              where: {
                id: assignmentId,
              },
              include: {
                details: {
                  include: {
                    equipment: {
                      include: {
                        type: true,
                      },
                    },
                  },
                },
              },
            });

          if (!assignment) {
            throw createAssignmentError(
              "Asignación no encontrada",
              404,
            );
          }

          if (
            assignment.status !== "ACTIVE"
          ) {
            throw createAssignmentError(
              "La asignación no se encuentra activa",
              409,
              [
                {
                  field: "assignment",
                  message:
                    "La provisión ya fue devuelta o no se encuentra activa",
                },
              ],
            );
          }

          if (
            assignment.type !==
            "PERMANENT"
          ) {
            throw createAssignmentError(
              "La asignación no corresponde a una provisión permanente de pistola",
              400,
              [
                {
                  field: "assignment",
                  message:
                    "Solo una provisión permanente de pistola puede devolverse con esta operación",
                },
              ],
            );
          }

          const pistolDetails =
            assignment.details.filter(
              (detail) =>
                isPistolEquipment(
                  detail.equipment,
                ),
            );

          const magazineDetails =
            assignment.details.filter(
              (detail) =>
                isMagazineEquipment(
                  detail.equipment,
                ),
            );

          const ammunitionDetails =
            assignment.details.filter(
              (detail) =>
                isNineMillimeterAmmunition(
                  detail.equipment,
                ),
            );

          const unrelatedDetails =
            assignment.details.filter(
              (detail) =>
                !isPistolEquipment(
                  detail.equipment,
                ) &&
                !isMagazineEquipment(
                  detail.equipment,
                ) &&
                !isNineMillimeterAmmunition(
                  detail.equipment,
                ),
            );

          const magazineQuantity =
            magazineDetails.reduce(
              (total, detail) =>
                total + detail.quantity,
              0,
            );

          const ammunitionQuantity =
            ammunitionDetails.reduce(
              (total, detail) =>
                total + detail.quantity,
              0,
            );

          const validProvision =
            pistolDetails.length === 1 &&
            pistolDetails[0].quantity === 1 &&
            magazineQuantity === 3 &&
            ammunitionQuantity === 50 &&
            unrelatedDetails.length === 0;

          if (!validProvision) {
            throw createAssignmentError(
              "La asignación no tiene la estructura de una provisión de pistola",
              409,
              [
                {
                  field: "assignment",
                  message:
                    "La provisión debe contener 1 pistola, 3 cargadores y 50 municiones 9 mm",
                },
              ],
            );
          }

          const pendingDetails =
            assignment.details
              .map((detail) => ({
                ...detail,
                pendingQuantity:
                  detail.quantity -
                  detail.returnedQuantity,
              }))
              .filter(
                (detail) =>
                  detail.pendingQuantity > 0,
              );

          if (
            pendingDetails.length === 0
          ) {
            throw createAssignmentError(
              "La provisión ya fue devuelta completamente",
              409,
            );
          }

          for (const detail of pendingDetails) {
            const equipment =
              detail.equipment;

            const newAvailableQuantity =
              equipment.availableQuantity +
              detail.pendingQuantity;

            if (
              newAvailableQuantity >
              equipment.totalQuantity
            ) {
              throw createAssignmentError(
                "La devolución produciría un stock inválido",
                409,
                [
                  {
                    field: "assignment",
                    message:
                      `No se puede devolver ${equipment.type.name} porque el stock disponible superaría el stock total`,
                  },
                ],
              );
            }

            const updatedDetail =
              await tx.assignmentDetail.updateMany(
                {
                  where: {
                    id: detail.id,
                    assignmentId,
                    returnedQuantity:
                      detail.returnedQuantity,
                  },
                  data: {
                    returnedQuantity: {
                      increment:
                        detail.pendingQuantity,
                    },
                  },
                },
              );

            if (
              updatedDetail.count !== 1
            ) {
              throw createAssignmentError(
                "La provisión cambió durante la devolución",
                409,
                [
                  {
                    field: "assignment",
                    message:
                      "No se pudo completar la devolución porque uno de los elementos cambió durante la operación",
                  },
                ],
              );
            }

            const updatedEquipment =
              await tx.equipment.updateMany(
                {
                  where: {
                    id: equipment.id,
                    availableQuantity:
                      equipment.availableQuantity,
                  },
                  data: {
                    availableQuantity: {
                      increment:
                        detail.pendingQuantity,
                    },
                    status: "DISPONIBLE",
                  },
                },
              );

            if (
              updatedEquipment.count !== 1
            ) {
              throw createAssignmentError(
                "El stock cambió durante la devolución",
                409,
                [
                  {
                    field: "assignment",
                    message:
                      `No se pudo reincorporar ${equipment.type.name} al stock`,
                  },
                ],
              );
            }
          }

          await tx.assignment.update({
            where: {
              id: assignmentId,
            },
            data: {
              status: "RETURNED",
              returnedAt: new Date(),
            },
          });

          return tx.assignment.findUnique({
            where: {
              id: assignmentId,
            },
            include:
              getAssignmentInclude(),
          });
        },
      );

    return res.status(200).json({
      success: true,
      data: updatedAssignment,
    });
  } catch (error) {
    console.error(
      "Error al devolver provisión de pistola:",
      error,
    );

    return sendControllerError(
      res,
      error,
      "No se pudo devolver la provisión de pistola",
    );
  }
};
