import prisma from "../lib/prisma.js";
import { equipmentTypeSchema } from "../schemas/equipmentType.schema.js";

// VALIDACIÓN
const formatValidationErrors = (issues) =>
  issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));

const GENERIC_CATEGORY_NAMES = new Set([
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

// LISTAR TIPOS
export const getEquipmentTypes = async (
  req,
  res,
) => {
  try {
    const equipmentTypes =
      await prisma.equipmentType.findMany({
        orderBy: [
          {
            category: "asc",
          },
          {
            name: "asc",
          },
        ],
      });

    return res.status(200).json({
      success: true,
      data: equipmentTypes,
    });
  } catch (error) {
    console.error(
      "Error al obtener tipos de equipamiento:",
      error,
    );

    return res.status(500).json({
      success: false,
      error: {
        message:
          "No se pudieron obtener los tipos de equipamiento",
      },
    });
  }
};

// CREAR TIPO
export const createEquipmentType = async (
  req,
  res,
) => {
  try {
    const validation =
      equipmentTypeSchema.safeParse(
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
      name,
      trackingMode,
      description,
      category,
      defaultAssignmentType,
    } = validation.data;

    // NOMBRE
    const normalizedName = name
      .trim()
      .toLowerCase();

    if (
      GENERIC_CATEGORY_NAMES.has(
        normalizedName,
      )
    ) {
      return res.status(400).json({
        success: false,
        error: {
          message:
            "Ingresá un tipo específico de equipamiento",
          details: [
            {
              field: "name",
              message:
                "La categoría no puede utilizarse como tipo. Por ejemplo, utilizá Pistola, Escopeta, Chaleco Balístico, HT o Munición 9 mm.",
            },
          ],
        },
      });
    }

    // ARMAMENTO
    if (
      category === "ARMAMENTO" &&
      trackingMode !== "INDIVIDUAL"
    ) {
      return res.status(400).json({
        success: false,
        error: {
          message:
            "El armamento debe administrarse de forma individual",
          details: [
            {
              field: "trackingMode",
              message:
                "Los tipos de armamento deben utilizar control individual.",
            },
          ],
        },
      });
    }

    // MUNICIÓN
    if (
      category === "MUNICION" &&
      trackingMode !== "QUANTITY"
    ) {
      return res.status(400).json({
        success: false,
        error: {
          message:
            "La munición debe administrarse por cantidad",
          details: [
            {
              field: "trackingMode",
              message:
                "Los tipos de munición deben utilizar control por cantidad.",
            },
          ],
        },
      });
    }

    // DUPLICADOS
    const existingType =
      await prisma.equipmentType.findFirst({
        where: {
          name: {
            equals: name.trim(),
            mode: "insensitive",
          },
        },
      });

    if (existingType) {
      return res.status(409).json({
        success: false,
        error: {
          message:
            "Ya existe un tipo de equipamiento con ese nombre",
          details: [
            {
              field: "name",
              message:
                "Ya existe un tipo de equipamiento con ese nombre",
            },
          ],
        },
      });
    }

    // GUARDAR
    const equipmentType =
      await prisma.equipmentType.create({
        data: {
          name: name.trim(),
          trackingMode,
          category,
          defaultAssignmentType:
            defaultAssignmentType || null,
          description:
            description?.trim() || null,
        },
      });

    return res.status(201).json({
      success: true,
      data: equipmentType,
    });
  } catch (error) {
    console.error(
      "Error al crear tipo de equipamiento:",
      error,
    );

    // DUPLICADO
    if (error?.code === "P2002") {
      return res.status(409).json({
        success: false,
        error: {
          message:
            "Ya existe un tipo de equipamiento con ese nombre",
          details: [
            {
              field: "name",
              message:
                "Ya existe un tipo de equipamiento con ese nombre",
            },
          ],
        },
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        message:
          "No se pudo crear el tipo de equipamiento",
      },
    });
  }
};