import { z } from "zod";

const PERSONNEL_STATUSES = [
  "Activo",
  "LEF",
  "LAO",
  "ETB",
  "ETP",
  "LAP",
  "LES",
  "LPM",
  "LPL",
];

const PERSONNEL_RANKS = [
  "Cadete",
  "Oficial Ayudante",
  "Oficial Principal",
  "Oficial Mayor",
  "Oficial Jefe",
  "Subinspector",
  "Inspector",
  "Comisionado Mayor",
  "Comisionado General",
];

const PERSONNEL_UNITS = [
  "UOSP-SMA",
];

const PERSONNEL_AREAS = [
  "Preventiva",
  "Operaciones",
  "Jefatura",
  "Logística",
  "GEDEx",
  "RRHH",
  "Credenciales",
  "AVSEC",
];

const BLOOD_TYPES = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
];

const optionalText = z
  .string()
  .trim()
  .max(
    1000,
    "El texto no puede superar los 1000 caracteres",
  )
  .optional()
  .nullable();

const optionalPhone = z
  .union([
    z
      .string()
      .trim()
      .min(
        6,
        "El teléfono debe tener al menos 6 caracteres",
      )
      .max(
        30,
        "El teléfono no puede superar los 30 caracteres",
      )
      .regex(
        /^[0-9+\-() ]+$/,
        "El teléfono contiene caracteres no válidos",
      ),
    z.literal(""),
    z.null(),
  ])
  .optional();

const optionalEmail = z
  .union([
    z
      .string()
      .trim()
      .max(
        150,
        "El email no puede superar los 150 caracteres",
      )
      .email(
        "Ingresá un email válido",
      ),
    z.literal(""),
    z.null(),
  ])
  .optional();

const optionalAddressStreet = z
  .union([
    z
      .string()
      .trim()
      .max(
        150,
        "La calle y número no pueden superar los 150 caracteres",
      ),
    z.literal(""),
    z.null(),
  ])
  .optional();

const optionalAddressDetail = z
  .union([
    z
      .string()
      .trim()
      .max(
        100,
        "El piso o departamento no puede superar los 100 caracteres",
      ),
    z.literal(""),
    z.null(),
  ])
  .optional();

const optionalAddressCity = z
  .union([
    z
      .string()
      .trim()
      .max(
        100,
        "La localidad no puede superar los 100 caracteres",
      ),
    z.literal(""),
    z.null(),
  ])
  .optional();

const optionalAddressProvince = z
  .union([
    z
      .string()
      .trim()
      .max(
        100,
        "La provincia no puede superar los 100 caracteres",
      ),
    z.literal(""),
    z.null(),
  ])
  .optional();

export const personnelSchema = z
  .object({
    firstName: z
      .string({
        message:
          "El nombre es obligatorio",
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

    lastName: z
      .string({
        message:
          "El apellido es obligatorio",
      })
      .trim()
      .min(
        2,
        "El apellido debe tener al menos 2 caracteres",
      )
      .max(
        80,
        "El apellido no puede superar los 80 caracteres",
      ),

    dni: z
      .string({
        message:
          "El DNI es obligatorio",
      })
      .trim()
      .min(
        6,
        "El DNI debe tener al menos 6 dígitos",
      )
      .max(
        12,
        "El DNI ingresado es demasiado largo",
      )
      .regex(
        /^[0-9.\-]+$/,
        "El DNI solo puede contener números, puntos o guiones",
      ),

    fileNumber: z
      .string({
        message:
          "El número de legajo es obligatorio",
      })
      .trim()
      .min(
        1,
        "El número de legajo es obligatorio",
      )
      .max(
        30,
        "El legajo no puede superar los 30 caracteres",
      ),

    rank: z.enum(
      PERSONNEL_RANKS,
      {
        message:
          "El grado seleccionado no es válido",
      },
    ),

    bloodType: z
      .union([
        z.enum(BLOOD_TYPES),
        z.literal(""),
        z.null(),
      ])
      .optional(),

    phone: optionalPhone,

    email: optionalEmail,

    addressStreet:
      optionalAddressStreet,

    addressDetail:
      optionalAddressDetail,

    addressCity:
      optionalAddressCity,

    addressProvince:
      optionalAddressProvince,

    status: z.enum(
      PERSONNEL_STATUSES,
      {
        message:
          "El estado seleccionado no es válido",
      },
    ),

    unit: z.enum(
      PERSONNEL_UNITS,
      {
        message:
          "La unidad seleccionada no es válida",
      },
    ),

    primaryArea: z.enum(
      PERSONNEL_AREAS,
      {
        message:
          "El área principal seleccionada no es válida",
      },
    ),

    additionalAreas: z
      .array(
        z.enum(
          PERSONNEL_AREAS,
          {
            message:
              "Una de las áreas adicionales no es válida",
          },
        ),
      )
      .default([]),

    dutyFunction: z
      .string()
      .trim()
      .max(
        150,
        "La función no puede superar los 150 caracteres",
      )
      .optional()
      .nullable(),

    observations: optionalText,
  })
  .superRefine((data, ctx) => {
    if (
      data.additionalAreas.includes(
        data.primaryArea,
      )
    ) {
      ctx.addIssue({
        code: "custom",
        path: [
          "additionalAreas",
        ],
        message:
          "El área principal no puede repetirse como área adicional",
      });
    }

    const uniqueAreas =
      new Set(
        data.additionalAreas,
      );

    if (
      uniqueAreas.size !==
      data.additionalAreas.length
    ) {
      ctx.addIssue({
        code: "custom",
        path: [
          "additionalAreas",
        ],
        message:
          "No puede haber áreas adicionales repetidas",
      });
    }
  });