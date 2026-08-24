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

const main = async () => {
  for (const type of equipmentTypes) {
    await prisma.equipmentType.upsert({
      where: {
        name: type.name,
      },
      update: type,
      create: type,
    });
  }

  console.log(
    "Seed SIGEP: tipos de equipamiento sincronizados.",
  );
};

main()
  .catch((error) => {
    console.error("Error ejecutando seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
