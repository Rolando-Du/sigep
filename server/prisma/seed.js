import bcrypt from "bcryptjs";

import prisma from "../src/lib/prisma.js";

const equipmentTypes = [
  {
    name: "Pistola",
    description: "Arma corta de dotación",
    category: "ARMAMENTO",
    trackingMode: "INDIVIDUAL",
    defaultAssignmentType: "PERMANENT",
    isActive: true,
  },
  {
    name: "Chaleco Balístico",
    description:
      "Chaleco antibalas de protección balística nivel RB4, para uso operativo. Protección frente a proyectiles 7,62 mm NATO (.308 Winchester) y 5,56 mm NATO (.223 Remington), conforme norma RENAR aplicable.",
    category: "PROTECCION",
    trackingMode: "INDIVIDUAL",
    defaultAssignmentType: "TEMPORARY",
    isActive: true,
  },
  {
    name: "Escopeta",
    description:
      "Armamento largo administrado como stock general.",
    category: "ARMAMENTO",
    trackingMode: "INDIVIDUAL",
    defaultAssignmentType: null,
    isActive: true,
  },
  {
    name: "HT",
    description:
      "Radio portátil administrada como stock general.",
    category: "COMUNICACIONES",
    trackingMode: "QUANTITY",
    defaultAssignmentType: null,
    isActive: true,
  },
  {
    name: "Munición 9 mm",
    description:
      "Munición calibre 9x19 mm para provisión de armamento.",
    category: "MUNICION",
    trackingMode: "QUANTITY",
    defaultAssignmentType: null,
    isActive: true,
  },
  {
    name: "Munición calibre 12",
    description:
      "Munición calibre 12 para provisión de escopeta.",
    category: "MUNICION",
    trackingMode: "QUANTITY",
    defaultAssignmentType: null,
    isActive: true,
  },
  {
    name: "Munición calibre 12 - Posta de goma",
    description:
      "Munición calibre 12 menos letal con posta de goma.",
    category: "MUNICION",
    trackingMode: "QUANTITY",
    defaultAssignmentType: null,
    isActive: true,
  },
  {
    name: "Cargador",
    description:
      "Almacén cargador de 17 municiones",
    category: "ACCESORIO",
    trackingMode: "QUANTITY",
    defaultAssignmentType: null,
    isActive: true,
  },
];

const seedEquipmentTypes = async () => {
  for (const type of equipmentTypes) {
    await prisma.equipmentType.upsert({
      where: {
        name: type.name,
      },
      update: type,
      create: type,
    });
  }
};

const seedAdmin = async () => {
  const existingAdmin =
    await prisma.user.findFirst({
      where: {
        role: "ADMIN",
      },
      orderBy: {
        id: "asc",
      },
    });

  if (existingAdmin) {
    console.log(
      `Seed SIGEP: ADMIN existente (${existingAdmin.username}), sin cambios.`,
    );

    return;
  }

  const username =
    process.env.ADMIN_USERNAME;

  const password =
    process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    throw new Error(
      "ADMIN_USERNAME y ADMIN_PASSWORD deben estar configurados para crear el administrador inicial",
    );
  }

  const passwordHash =
    await bcrypt.hash(
      password,
      12,
    );

  await prisma.user.create({
    data: {
      username: username.trim(),
      passwordHash,
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log(
    `Seed SIGEP: ADMIN inicial creado (${username.trim()}).`,
  );
};

const main = async () => {
  await seedEquipmentTypes();
  await seedAdmin();

  console.log(
    "Seed SIGEP finalizado correctamente.",
  );
};

main()
  .catch((error) => {
    console.error(
      "Error ejecutando seed:",
      error,
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });