import prisma from "../lib/prisma.js";

import { personnelSchema } from "../schemas/personnel.schema.js";

const formatValidationErrors = (issues) =>
  issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));

const formatUniqueConstraintError = (error) => {
  const target = error?.meta?.target;

  const fields = Array.isArray(target)
    ? target
    : target
      ? [target]
      : [];

  const details = [];

  if (
    fields.some((field) =>
      String(field).includes("dni"),
    )
  ) {
    details.push({
      field: "dni",
      message:
        "Ya existe una persona registrada con ese DNI",
    });
  }

  if (
    fields.some((field) =>
      String(field).includes("fileNumber"),
    )
  ) {
    details.push({
      field: "fileNumber",
      message:
        "Ya existe una persona registrada con ese número de legajo",
    });
  }

  return details;
};

const findDuplicatePersonnel = async ({
  dni,
  fileNumber,
  excludeId = null,
}) => {
  const duplicatedPersonnel =
    await prisma.personnel.findMany({
      where: {
        AND: [
          excludeId
            ? {
                id: {
                  not: excludeId,
                },
              }
            : {},
          {
            OR: [
              {
                dni,
              },
              {
                fileNumber,
              },
            ],
          },
        ],
      },

      select: {
        id: true,
        dni: true,
        fileNumber: true,
      },
    });

  const details = [];

  const duplicatedDni =
    duplicatedPersonnel.some(
      (person) =>
        person.dni === dni,
    );

  const duplicatedFileNumber =
    duplicatedPersonnel.some(
      (person) =>
        person.fileNumber ===
        fileNumber,
    );

  if (duplicatedDni) {
    details.push({
      field: "dni",
      message:
        "Ya existe una persona registrada con ese DNI",
    });
  }

  if (duplicatedFileNumber) {
    details.push({
      field: "fileNumber",
      message:
        "Ya existe una persona registrada con ese número de legajo",
    });
  }

  return details;
};

export const getPersonnel = async (
  req,
  res,
) => {
  try {
    const personnel =
      await prisma.personnel.findMany({
        orderBy: [
          {
            lastName: "asc",
          },
          {
            firstName: "asc",
          },
        ],
      });

    return res.status(200).json({
      success: true,
      data: personnel,
    });
  } catch (error) {
    console.error(
      "Error al obtener personal:",
      error,
    );

    return res.status(500).json({
      success: false,
      error: {
        message:
          "No se pudo obtener el personal",
      },
    });
  }
};

export const createPersonnel = async (
  req,
  res,
) => {
  try {
    const validation =
      personnelSchema.safeParse(
        req.body,
      );

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
      firstName,
      lastName,
      dni,
      fileNumber,
      rank,
      bloodType,

      phone,
      email,

      addressStreet,
      addressDetail,
      addressCity,
      addressProvince,

      status,
      unit,
      primaryArea,
      additionalAreas,
      dutyFunction,
      observations,
    } = validation.data;

    /*
     * Validamos DNI y legajo antes
     * de intentar guardar.
     */
    const duplicateDetails =
      await findDuplicatePersonnel({
        dni,
        fileNumber,
      });

    if (duplicateDetails.length > 0) {
      return res.status(409).json({
        success: false,
        error: {
          message:
            "Ya existe personal con esos datos",

          details:
            duplicateDetails,
        },
      });
    }

    const personnel =
      await prisma.personnel.create({
        data: {
          firstName,
          lastName,
          dni,
          fileNumber,
          rank,

          bloodType:
            bloodType || null,

          phone:
            phone || null,

          email:
            email || null,

          addressStreet:
            addressStreet || null,

          addressDetail:
            addressDetail || null,

          addressCity:
            addressCity || null,

          addressProvince:
            addressProvince || null,

          status,
          unit,
          primaryArea,
          additionalAreas,

          dutyFunction:
            dutyFunction || null,

          observations:
            observations || null,
        },
      });

    return res.status(201).json({
      success: true,
      data: personnel,
    });
  } catch (error) {
    console.error(
      "Error al crear personal:",
      error,
    );

    /*
     * Segunda capa de protección
     * ante DNI o legajo duplicado.
     */
    if (error?.code === "P2002") {
      const details =
        formatUniqueConstraintError(
          error,
        );

      return res.status(409).json({
        success: false,
        error: {
          message:
            "Ya existe personal con esos datos",

          details,
        },
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        message:
          "No se pudo crear el personal",
      },
    });
  }
};

export const updatePersonnel = async (
  req,
  res,
) => {
  try {
    const id = Number(
      req.params.id,
    );

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return res.status(400).json({
        success: false,
        error: {
          message:
            "ID de personal inválido",
        },
      });
    }

    const validation =
      personnelSchema.safeParse(
        req.body,
      );

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

    const existingPersonnel =
      await prisma.personnel.findUnique({
        where: {
          id,
        },
      });

    if (!existingPersonnel) {
      return res.status(404).json({
        success: false,
        error: {
          message:
            "Personal no encontrado",
        },
      });
    }

    const {
      firstName,
      lastName,
      dni,
      fileNumber,
      rank,
      bloodType,

      phone,
      email,

      addressStreet,
      addressDetail,
      addressCity,
      addressProvince,

      status,
      unit,
      primaryArea,
      additionalAreas,
      dutyFunction,
      observations,
    } = validation.data;

    /*
     * Buscamos DNI o legajo duplicados,
     * excluyendo a la persona que
     * estamos editando.
     */
    const duplicateDetails =
      await findDuplicatePersonnel({
        dni,
        fileNumber,
        excludeId: id,
      });

    if (duplicateDetails.length > 0) {
      return res.status(409).json({
        success: false,
        error: {
          message:
            "Ya existe personal con esos datos",

          details:
            duplicateDetails,
        },
      });
    }

    const updatedPersonnel =
      await prisma.personnel.update({
        where: {
          id,
        },

        data: {
          firstName,
          lastName,
          dni,
          fileNumber,
          rank,

          bloodType:
            bloodType || null,

          phone:
            phone || null,

          email:
            email || null,

          addressStreet:
            addressStreet || null,

          addressDetail:
            addressDetail || null,

          addressCity:
            addressCity || null,

          addressProvince:
            addressProvince || null,

          status,
          unit,
          primaryArea,
          additionalAreas,

          dutyFunction:
            dutyFunction || null,

          observations:
            observations || null,
        },
      });

    return res.status(200).json({
      success: true,
      data: updatedPersonnel,
    });
  } catch (error) {
    console.error(
      "Error al actualizar personal:",
      error,
    );

    if (error?.code === "P2002") {
      const details =
        formatUniqueConstraintError(
          error,
        );

      return res.status(409).json({
        success: false,
        error: {
          message:
            "Ya existe personal con esos datos",

          details,
        },
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        message:
          "No se pudo actualizar el personal",
      },
    });
  }
};