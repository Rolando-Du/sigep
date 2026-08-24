import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Check,
  Package,
  Plus,
  ShieldCheck,
  X,
} from "lucide-react";

import {
  createAssignment,
} from "../../services/assignment.service";

import {
  getEquipment,
} from "../../services/equipment.service";

const STANDARD_MAGAZINES = 3;
const STANDARD_AMMUNITION = 50;

const SHOTGUN_AMMUNITION_OPTIONS = [
  10,
  15,
  20,
];

const DEFAULT_SHOTGUN_AMMUNITION =
  SHOTGUN_AMMUNITION_OPTIONS[0];

const normalizeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .trim()
    .toLowerCase();

const getDefaultAssignmentType = (
  item,
) =>
  item?.type
    ?.defaultAssignmentType ||
  null;

const getAssignmentTypeLabel = (
  type,
) => {
  if (type === "PERMANENT") {
    return "Permanente";
  }

  if (type === "TEMPORARY") {
    return "Temporaria";
  }

  return "Sin modalidad";
};

/*
 * ARMAMENTO
 */
const isArmamentEquipment = (
  item,
) =>
  item?.type?.category ===
  "ARMAMENTO";

/*
 * PISTOLA
 *
 * Solamente la pistola genera
 * la provisión permanente:
 *
 * 1 pistola
 * 3 cargadores
 * 50 municiones 9 mm
 */
const isPistolEquipment = (
  item,
) => {
  if (
    !isArmamentEquipment(item)
  ) {
    return false;
  }

  const typeName =
    normalizeText(
      item?.type?.name,
    );

  return typeName.includes(
    "pistola",
  );
};

/*
 * ESCOPETA
 *
 * La escopeta genera una provisión
 * temporaria junto con munición
 * calibre 12.
 *
 * El operador puede seleccionar:
 *
 * 10, 15 o 20 cartuchos.
 */
const isShotgunEquipment = (
  item,
) => {
  if (
    !isArmamentEquipment(item)
  ) {
    return false;
  }

  const typeName =
    normalizeText(
      item?.type?.name,
    );

  return typeName.includes(
    "escopeta",
  );
};

const isMagazineEquipment = (
  item,
) => {
  const typeName =
    normalizeText(
      item?.type?.name,
    );

  return (
    item?.type?.category ===
      "ACCESORIO" &&
    typeName.includes(
      "cargador",
    )
  );
};

const isAmmunitionEquipment = (
  item,
) => {
  const typeName =
    normalizeText(
      item?.type?.name,
    );

  return (
    item?.type?.category ===
      "MUNICION" ||
    typeName.includes(
      "municion",
    ) ||
    typeName.includes(
      "cartucho",
    )
  );
};

const isNineMillimeterAmmunition = (
  item,
) => {
  if (
    !isAmmunitionEquipment(item)
  ) {
    return false;
  }

  const searchableText =
    normalizeText(
      [
        item.type?.name,
        item.type
          ?.description,
        item.brand,
        item.model,
        item.observations,
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

const isTwelveGaugeAmmunition = (
  item,
) => {
  if (
    !isAmmunitionEquipment(item)
  ) {
    return false;
  }

  const searchableText =
    normalizeText(
      [
        item.type?.name,
        item.type
          ?.description,
        item.brand,
        item.model,
        item.observations,
      ]
        .filter(Boolean)
        .join(" "),
    );

  return (
    searchableText.includes(
      "calibre 12",
    ) ||
    searchableText.includes(
      "cal 12",
    ) ||
    searchableText.includes(
      "12/70",
    ) ||
    searchableText.includes(
      "12-70",
    ) ||
    searchableText.includes(
      "12 ga",
    ) ||
    searchableText.includes(
      "12ga",
    ) ||
    searchableText.includes(
      "12 mm",
    ) ||
    searchableText.includes(
      "12mm",
    )
  );
};

const getCompatibilityScore = (
  item,
  pistol,
) => {
  let score = 0;

  const itemBrand =
    normalizeText(
      item?.brand,
    );

  const pistolBrand =
    normalizeText(
      pistol?.brand,
    );

  const itemModel =
    normalizeText(
      item?.model,
    );

  const pistolModel =
    normalizeText(
      pistol?.model,
    );

  if (
    itemBrand &&
    pistolBrand &&
    itemBrand ===
      pistolBrand
  ) {
    score += 10;
  }

  if (
    itemModel &&
    pistolModel
  ) {
    if (
      itemModel.includes(
        pistolModel,
      ) ||
      pistolModel.includes(
        itemModel,
      )
    ) {
      score += 5;
    }

    const pistolTokens =
      pistolModel
        .split(/\s+/)
        .filter(
          (token) =>
            token.length >= 3,
        );

    pistolTokens.forEach(
      (token) => {
        if (
          itemModel.includes(
            token,
          )
        ) {
          score += 1;
        }
      },
    );
  }

  return score;
};

const findMagazineStock = (
  equipment,
  pistol,
) => {
  return equipment
    .filter(
      (item) =>
        isMagazineEquipment(
          item,
        ) &&
        item.type
          ?.trackingMode ===
          "QUANTITY" &&
        item.status ===
          "DISPONIBLE" &&
        item.availableQuantity >=
          STANDARD_MAGAZINES,
    )
    .sort(
      (a, b) =>
        getCompatibilityScore(
          b,
          pistol,
        ) -
        getCompatibilityScore(
          a,
          pistol,
        ),
    )[0];
};

const findAmmunitionStock = (
  equipment,
) => {
  return equipment.find(
    (item) =>
      isNineMillimeterAmmunition(
        item,
      ) &&
      item.type
        ?.trackingMode ===
        "QUANTITY" &&
      item.status ===
        "DISPONIBLE" &&
      item.availableQuantity >=
        STANDARD_AMMUNITION,
  );
};

const getTwelveGaugeAmmunitionStocks = (
  equipment,
) => {
  return equipment
    .filter(
      (item) =>
        isTwelveGaugeAmmunition(
          item,
        ) &&
        item.type
          ?.trackingMode ===
          "QUANTITY" &&
        item.status ===
          "DISPONIBLE" &&
        item.availableQuantity >
          0,
    )
    .sort((a, b) => {
      const typeComparison =
        String(
          a.type?.name || "",
        ).localeCompare(
          String(
            b.type?.name || "",
          ),
          "es",
          {
            sensitivity:
              "base",
          },
        );

      if (typeComparison !== 0) {
        return typeComparison;
      }

      return (
        b.availableQuantity -
        a.availableQuantity
      );
    });
};

const PersonnelAssignmentModal = ({
  isOpen,
  onClose,
  person,
  onCreated,
}) => {
  const [
    equipment,
    setEquipment,
  ] = useState([]);

  const [
    assignmentType,
    setAssignmentType,
  ] = useState(
    "PERMANENT",
  );

  const [
    selectedItems,
    setSelectedItems,
  ] = useState({});

  const [
    observations,
    setObservations,
  ] = useState("");

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /*
   * CARGA DE EQUIPAMIENTO
   */
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let ignore = false;

    const loadEquipment =
      async () => {
        try {
          setIsLoading(
            true,
          );

          setError("");

          const data =
            await getEquipment();

          if (!ignore) {
            setEquipment(
              Array.isArray(
                data,
              )
                ? data
                : [],
            );
          }
        } catch (
          loadError
        ) {
          if (!ignore) {
            setEquipment([]);

            setError(
              loadError.message ||
                "No se pudo obtener el equipamiento disponible",
            );
          }
        } finally {
          if (!ignore) {
            setIsLoading(
              false,
            );
          }
        }
      };

    setAssignmentType(
      "PERMANENT",
    );

    setSelectedItems({});

    setObservations("");

    loadEquipment();

    return () => {
      ignore = true;
    };
  }, [isOpen]);

  /*
   * EQUIPAMIENTO DISPONIBLE
   */
  const availableEquipment =
    useMemo(() => {
      return equipment.filter(
        (item) =>
          item.type
            ?.isActive &&
          item.status ===
            "DISPONIBLE" &&
          item.availableQuantity >
            0,
      );
    }, [equipment]);

  /*
   * STOCKS DE MUNICIÓN CALIBRE 12
   *
   * Se mantienen separados para que
   * el operador pueda elegir el tipo:
   *
   * - Convencional
   * - Posta de goma
   * - cualquier otra variante calibre 12
   */
  const twelveGaugeAmmunitionStocks =
    useMemo(
      () =>
        getTwelveGaugeAmmunitionStocks(
          availableEquipment,
        ),
      [availableEquipment],
    );

  /*
   * EQUIPAMIENTO SELECCIONADO
   */
  const selectedEquipment =
    useMemo(() => {
      return availableEquipment.filter(
        (item) =>
          selectedItems[
            item.id
          ]?.selected,
      );
    }, [
      availableEquipment,
      selectedItems,
    ]);

  /*
   * MODALIDADES OBLIGATORIAS
   * PRESENTES EN LA SELECCIÓN
   */
  const selectedDefaultAssignmentTypes =
    useMemo(() => {
      return [
        ...new Set(
          selectedEquipment
            .map(
              getDefaultAssignmentType,
            )
            .filter(Boolean),
        ),
      ];
    }, [
      selectedEquipment,
    ]);

  /*
   * Si los elementos seleccionados
   * poseen una única modalidad
   * predeterminada, esa modalidad
   * queda bloqueada.
   */
  const enforcedAssignmentType =
    selectedDefaultAssignmentTypes
      .length === 1
      ? selectedDefaultAssignmentTypes[0]
      : null;

  /*
   * Seguridad adicional:
   * mantenemos el estado sincronizado
   * con la modalidad determinada
   * por EquipmentType.
   */
  useEffect(() => {
    if (
      enforcedAssignmentType &&
      assignmentType !==
        enforcedAssignmentType
    ) {
      setAssignmentType(
        enforcedAssignmentType,
      );
    }
  }, [
    enforcedAssignmentType,
    assignmentType,
  ]);

  /*
   * PISTOLA SELECCIONADA
   */
  const selectedPistol =
    useMemo(() => {
      return selectedEquipment.find(
        (item) =>
          isPistolEquipment(
            item,
          ),
      );
    }, [
      selectedEquipment,
    ]);

  /*
   * ESCOPETA SELECCIONADA
   */
  const selectedShotgun =
    useMemo(() => {
      return selectedEquipment.find(
        (item) =>
          isShotgunEquipment(
            item,
          ),
      );
    }, [
      selectedEquipment,
    ]);

  /*
   * PROVISIÓN TEMPORARIA
   * DE ESCOPETA
   */
  const isShotgunProvision =
    assignmentType ===
      "TEMPORARY" &&
    Boolean(
      selectedShotgun,
    );

  /*
   * PROVISIÓN PERMANENTE
   * DE PISTOLA
   */
  const isPistolProvision =
    assignmentType ===
      "PERMANENT" &&
    Boolean(
      selectedPistol,
    );

  const selectedCount =
    Object.values(
      selectedItems,
    ).filter(
      (item) =>
        item.selected,
    ).length;

  /*
   * ESTADO DE DOTACIÓN
   */
  const provisionStatus =
    useMemo(() => {
      if (
        !isPistolProvision
      ) {
        return {
          magazines: 0,
          ammunition: 0,
          complete: true,
        };
      }

      let magazines = 0;
      let ammunition = 0;

      availableEquipment.forEach(
        (item) => {
          const selected =
            selectedItems[
              item.id
            ];

          if (
            !selected
              ?.selected
          ) {
            return;
          }

          if (
            isMagazineEquipment(
              item,
            )
          ) {
            magazines +=
              Number(
                selected.quantity,
              ) || 0;
          }

          if (
            isNineMillimeterAmmunition(
              item,
            )
          ) {
            ammunition +=
              Number(
                selected.quantity,
              ) || 0;
          }
        },
      );

      return {
        magazines,
        ammunition,

        complete:
          magazines ===
            STANDARD_MAGAZINES &&
          ammunition ===
            STANDARD_AMMUNITION,
      };
    }, [
      availableEquipment,
      selectedItems,
      isPistolProvision,
    ]);

  /*
   * ESTADO DE DOTACIÓN
   * DE ESCOPETA
   */
  const shotgunProvisionStatus =
    useMemo(() => {
      if (
        !isShotgunProvision
      ) {
        return {
          ammunition: 0,
          ammunitionId: null,
          ammunitionName: "",
          availableQuantity: 0,
          complete: true,
        };
      }

      const ammunition =
        availableEquipment.find(
          (item) =>
            isTwelveGaugeAmmunition(
              item,
            ) &&
            selectedItems[
              item.id
            ]?.role ===
              "SHOTGUN_AMMUNITION",
        );

      if (!ammunition) {
        return {
          ammunition: 0,
          ammunitionId: null,
          ammunitionName: "",
          availableQuantity: 0,
          complete: false,
        };
      }

      const selected =
        selectedItems[
          ammunition.id
        ];

      const quantity =
        Number(
          selected?.quantity,
        ) || 0;

      return {
        ammunition:
          quantity,

        ammunitionId:
          ammunition.id,

        ammunitionName:
          ammunition.type
            ?.name ||
          "Munición calibre 12",

        availableQuantity:
          ammunition.availableQuantity,

        complete:
          SHOTGUN_AMMUNITION_OPTIONS.includes(
            quantity,
          ) &&
          ammunition.availableQuantity >=
            quantity,
      };
    }, [
      availableEquipment,
      selectedItems,
      isShotgunProvision,
    ]);

  /*
   * CREA AUTOMÁTICAMENTE
   * LA PROVISIÓN DE PISTOLA
   */
  const createPistolProvisionSelection =
    (pistol) => {
      const magazine =
        findMagazineStock(
          availableEquipment,
          pistol,
        );

      const ammunition =
        findAmmunitionStock(
          availableEquipment,
        );

      const next = {
        [pistol.id]: {
          selected: true,
          quantity: 1,
          role: "PISTOL",
          autoAdded: false,
        },
      };

      if (magazine) {
        next[
          magazine.id
        ] = {
          selected: true,
          quantity:
            STANDARD_MAGAZINES,
          role:
            "MAGAZINE",
          autoAdded: true,
        };
      }

      if (ammunition) {
        next[
          ammunition.id
        ] = {
          selected: true,
          quantity:
            STANDARD_AMMUNITION,
          role:
            "AMMUNITION",
          autoAdded: true,
        };
      }

      setSelectedItems(
        next,
      );

      if (
        !magazine &&
        !ammunition
      ) {
        setError(
          "No hay stock suficiente de cargadores ni municiones 9 mm para completar la dotación.",
        );

        return;
      }

      if (!magazine) {
        setError(
          `La provisión requiere ${STANDARD_MAGAZINES} cargadores disponibles.`,
        );

        return;
      }

      if (!ammunition) {
        setError(
          `La provisión requiere ${STANDARD_AMMUNITION} municiones 9 mm disponibles.`,
        );

        return;
      }

      setError("");
    };

  /*
   * INICIA LA PROVISIÓN DE ESCOPETA
   *
   * Al seleccionar la escopeta NO
   * elegimos automáticamente un tipo
   * de munición.
   *
   * El operador debe seleccionar
   * expresamente qué stock calibre 12
   * desea utilizar.
   */
  const createShotgunProvisionSelection =
    (shotgun) => {
      setSelectedItems({
        [shotgun.id]: {
          selected: true,
          quantity: 1,
          role: "SHOTGUN",
          autoAdded: false,
        },
      });

      if (
        twelveGaugeAmmunitionStocks
          .length === 0
      ) {
        setError(
          "No hay stock disponible de munición calibre 12 para completar la provisión de escopeta.",
        );

        return;
      }

      setError("");
    };

  /*
   * SELECCIONA EL TIPO / STOCK
   * DE MUNICIÓN CALIBRE 12.
   *
   * Si ya había otro tipo de munición
   * seleccionado para la escopeta,
   * se reemplaza por el nuevo.
   */
  const handleShotgunAmmunitionTypeChange =
    (equipmentId) => {
      const ammunition =
        twelveGaugeAmmunitionStocks.find(
          (item) =>
            item.id ===
            Number(
              equipmentId,
            ),
        );

      if (!ammunition) {
        setError(
          "No se encontró el tipo de munición calibre 12 seleccionado.",
        );

        return;
      }

      if (
        ammunition.availableQuantity <
        DEFAULT_SHOTGUN_AMMUNITION
      ) {
        setError(
          `El stock seleccionado no alcanza para la provisión mínima de ${DEFAULT_SHOTGUN_AMMUNITION} cartuchos. Disponible: ${ammunition.availableQuantity}.`,
        );

        return;
      }

      setSelectedItems(
        (current) => {
          const next = {
            ...current,
          };

          Object.entries(
            next,
          ).forEach(
            ([
              selectedEquipmentId,
              selectedItem,
            ]) => {
              if (
                selectedItem?.role ===
                "SHOTGUN_AMMUNITION"
              ) {
                delete next[
                  selectedEquipmentId
                ];
              }
            },
          );

          next[
            ammunition.id
          ] = {
            selected: true,
            quantity:
              DEFAULT_SHOTGUN_AMMUNITION,
            role:
              "SHOTGUN_AMMUNITION",
            autoAdded: true,
          };

          return next;
        },
      );

      setError("");
    };

  /*
   * CAMBIA LA CANTIDAD DE
   * MUNICIÓN CALIBRE 12
   *
   * Opciones permitidas:
   * 10, 15 o 20.
   */
  const handleShotgunAmmunitionChange =
    (quantity) => {
      const nextQuantity =
        Number(quantity);

      if (
        !SHOTGUN_AMMUNITION_OPTIONS.includes(
          nextQuantity,
        )
      ) {
        return;
      }

      const ammunition =
        availableEquipment.find(
          (item) =>
            isTwelveGaugeAmmunition(
              item,
            ) &&
            selectedItems[
              item.id
            ]?.role ===
              "SHOTGUN_AMMUNITION",
        );

      if (!ammunition) {
        setError(
          "Primero seleccioná el tipo de munición calibre 12.",
        );

        return;
      }

      if (
        ammunition.availableQuantity <
        nextQuantity
      ) {
        setError(
          `Stock insuficiente de ${ammunition.type?.name || "munición calibre 12"}. Disponible: ${ammunition.availableQuantity}.`,
        );

        return;
      }

      setSelectedItems(
        (current) => ({
          ...current,

          [ammunition.id]: {
            ...current[
              ammunition.id
            ],

            selected: true,
            quantity:
              nextQuantity,
            role:
              "SHOTGUN_AMMUNITION",
            autoAdded: true,
          },
        }),
      );

      setError("");
    };

  /*
   * CAMBIO MANUAL DE MODALIDAD
   *
   * Solo se permite si ningún
   * equipamiento seleccionado tiene
   * una modalidad predeterminada.
   */
  const handleAssignmentTypeChange =
    (nextType) => {
      if (
        isSaving ||
        nextType ===
          assignmentType
      ) {
        return;
      }

      if (
        enforcedAssignmentType &&
        nextType !==
          enforcedAssignmentType
      ) {
        setError(
          `La modalidad está definida automáticamente por el equipamiento seleccionado: ${getAssignmentTypeLabel(
            enforcedAssignmentType,
          )}.`,
        );

        return;
      }

      setAssignmentType(
        nextType,
      );

      setError("");

      /*
       * Compatibilidad con una
       * pistola cuyo tipo todavía no
       * tuviera defaultAssignmentType.
       */
      if (
        nextType ===
          "PERMANENT" &&
        selectedPistol
      ) {
        createPistolProvisionSelection(
          selectedPistol,
        );

        return;
      }

      /*
       * Al pasar manualmente a
       * Temporaria quitamos solamente
       * elementos automáticos.
       */
      if (
        nextType ===
        "TEMPORARY"
      ) {
        setSelectedItems(
          (current) => {
            const next = {};

            Object.entries(
              current,
            ).forEach(
              ([
                equipmentId,
                item,
              ]) => {
                if (
                  !item.autoAdded
                ) {
                  next[
                    equipmentId
                  ] = item;
                }
              },
            );

            return next;
          },
        );
      }
    };

  /*
   * SELECCIÓN / DESELECCIÓN
   */
  const handleToggleEquipment =
    (item) => {
      const currentItem =
        selectedItems[
          item.id
        ];

      /*
       * DESELECCIONAR
       */
      if (
        currentItem
          ?.selected
      ) {
        /*
         * Las provisiones de Pistola
         * y Escopeta se eliminan
         * completas.
         */
        if (
          isPistolEquipment(
            item,
          ) ||
          isShotgunEquipment(
            item,
          )
        ) {
          setSelectedItems({});

          setError("");

          return;
        }

        setSelectedItems(
          (current) => {
            const next = {
              ...current,
            };

            delete next[
              item.id
            ];

            return next;
          },
        );

        setError("");

        return;
      }

      const itemDefaultAssignmentType =
        getDefaultAssignmentType(
          item,
        );

      /*
       * No permitimos mezclar dentro
       * de una misma Assignment
       * elementos que exigen
       * modalidades distintas.
       *
       * Ejemplo:
       *
       * Pistola  → PERMANENT
       * Escopeta → TEMPORARY
       */
      if (
        itemDefaultAssignmentType &&
        selectedDefaultAssignmentTypes
          .length > 0 &&
        !selectedDefaultAssignmentTypes.includes(
          itemDefaultAssignmentType,
        )
      ) {
        setError(
          `Este equipamiento es de asignación ${getAssignmentTypeLabel(
            itemDefaultAssignmentType,
          ).toLowerCase()} y no puede combinarse con los elementos seleccionados actualmente.`,
        );

        return;
      }

      /*
       * Si el tipo define una modalidad,
       * la aplicamos automáticamente.
       */
      if (
        itemDefaultAssignmentType
      ) {
        setAssignmentType(
          itemDefaultAssignmentType,
        );
      }

      /*
       * PISTOLA
       *
       * La pistola siempre genera una
       * provisión separada.
       */
      if (
        isPistolEquipment(
          item,
        )
      ) {
        if (
          itemDefaultAssignmentType &&
          itemDefaultAssignmentType !==
            "PERMANENT"
        ) {
          setError(
            "El tipo Pistola está configurado incorrectamente. Debe utilizar asignación Permanente.",
          );

          return;
        }

        if (
          selectedCount > 0
        ) {
          setError(
            "La provisión de pistola debe registrarse separada de otros equipos.",
          );

          return;
        }

        setAssignmentType(
          "PERMANENT",
        );

        createPistolProvisionSelection(
          item,
        );

        return;
      }

      /*
       * ESCOPETA
       *
       * Siempre TEMPORARY y con
       * munición calibre 12.
       */
      if (
        isShotgunEquipment(
          item,
        )
      ) {
        if (
          itemDefaultAssignmentType &&
          itemDefaultAssignmentType !==
            "TEMPORARY"
        ) {
          setError(
            "El tipo Escopeta está configurado incorrectamente. Debe utilizar asignación Temporaria.",
          );

          return;
        }

        if (
          selectedCount > 0
        ) {
          setError(
            "La provisión de escopeta debe registrarse separada de otros equipos.",
          );

          return;
        }

        setAssignmentType(
          "TEMPORARY",
        );

        createShotgunProvisionSelection(
          item,
        );

        return;
      }

      /*
       * Mientras exista una provisión
       * permanente de pistola, no se
       * permite incorporar otros equipos.
       */
      if (
        isPistolProvision
      ) {
        setError(
          "La provisión de pistola debe registrarse separada de chalecos, radios, escopetas u otros equipos.",
        );

        return;
      }

      /*
       * Mientras exista una provisión
       * temporaria de escopeta, no se
       * permite incorporar otros equipos.
       */
      if (
        isShotgunProvision
      ) {
        setError(
          "La provisión de escopeta debe registrarse separada de HT, chalecos, pistolas u otros equipos.",
        );

        return;
      }

      /*
       * SELECCIÓN NORMAL
       *
       * Aquí entra, por ejemplo,
       * una Escopeta TEMPORARY.
       */
      setSelectedItems(
        (current) => ({
          ...current,

          [item.id]: {
            selected: true,
            quantity: 1,
            autoAdded: false,
          },
        }),
      );

      setError("");
    };

  const handleQuantityChange =
    (
      item,
      value,
    ) => {
      const currentItem =
        selectedItems[
          item.id
        ];

      /*
       * Las cantidades de la
       * dotación automática no
       * pueden modificarse.
       */
      if (
        currentItem
          ?.autoAdded
      ) {
        return;
      }

      const quantity =
        Number(value);

      setSelectedItems(
        (current) => ({
          ...current,

          [item.id]: {
            ...current[
              item.id
            ],

            selected: true,

            quantity:
              Number.isFinite(
                quantity,
              )
                ? quantity
                : 1,
          },
        }),
      );
    };

  const handleClose = () => {
    if (isSaving) {
      return;
    }

    onClose();
  };

  /*
   * GUARDAR ASIGNACIÓN
   */
  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault();

    if (
      !person?.id ||
      isSaving
    ) {
      return;
    }

    const details =
      Object.entries(
        selectedItems,
      )
        .filter(
          ([, item]) =>
            item.selected,
        )
        .map(
          ([
            equipmentId,
            item,
          ]) => ({
            equipmentId:
              Number(
                equipmentId,
              ),

            quantity:
              Number(
                item.quantity,
              ),
          }),
        );

    if (
      details.length ===
      0
    ) {
      setError(
        "Seleccioná al menos un equipamiento",
      );

      return;
    }

    /*
     * SEGURIDAD:
     * no debería ocurrir por la UI,
     * pero evitamos guardar una
     * combinación incompatible.
     */
    if (
      selectedDefaultAssignmentTypes
        .length > 1
    ) {
      setError(
        "Los equipos seleccionados requieren modalidades de asignación diferentes.",
      );

      return;
    }

    /*
     * La modalidad enviada debe
     * coincidir con la predeterminada
     * del equipamiento.
     */
    if (
      enforcedAssignmentType &&
      assignmentType !==
        enforcedAssignmentType
    ) {
      setError(
        `La modalidad correcta para el equipamiento seleccionado es ${getAssignmentTypeLabel(
          enforcedAssignmentType,
        )}.`,
      );

      return;
    }

    /*
     * PISTOLA
     */
    if (
      selectedPistol &&
      assignmentType !==
        "PERMANENT"
    ) {
      setError(
        "La pistola debe registrarse como asignación Permanente.",
      );

      return;
    }

    /*
     * ESCOPETA
     */
    if (
      selectedShotgun &&
      assignmentType !==
        "TEMPORARY"
    ) {
      setError(
        "La escopeta debe registrarse como asignación Temporaria.",
      );

      return;
    }

    /*
     * PROVISIÓN DE ESCOPETA
     */
    if (
      isShotgunProvision
    ) {
      if (
        !shotgunProvisionStatus
          .ammunitionId
      ) {
        setError(
          "Seleccioná el tipo de munición calibre 12 para la provisión de escopeta.",
        );

        return;
      }

      if (
        !SHOTGUN_AMMUNITION_OPTIONS.includes(
          shotgunProvisionStatus
            .ammunition,
        )
      ) {
        setError(
          "La provisión de escopeta debe incluir 10, 15 o 20 municiones calibre 12.",
        );

        return;
      }
    }

    /*
     * PROVISIÓN DE PISTOLA
     */
    if (
      isPistolProvision
    ) {
      if (
        provisionStatus
          .magazines !==
        STANDARD_MAGAZINES
      ) {
        setError(
          `La provisión permanente debe incluir exactamente ${STANDARD_MAGAZINES} cargadores.`,
        );

        return;
      }

      if (
        provisionStatus
          .ammunition !==
        STANDARD_AMMUNITION
      ) {
        setError(
          `La provisión permanente debe incluir exactamente ${STANDARD_AMMUNITION} municiones 9 mm.`,
        );

        return;
      }
    }

    /*
     * CANTIDADES
     */
    const invalidDetail =
      details.find(
        (detail) =>
          !Number.isInteger(
            detail.quantity,
          ) ||
          detail.quantity <=
            0,
      );

    if (invalidDetail) {
      setError(
        "Las cantidades seleccionadas no son válidas",
      );

      return;
    }

    try {
      setIsSaving(
        true,
      );

      setError("");

      const userObservation =
        observations.trim();

      const automaticObservation =
        isPistolProvision
          ? "Provisión permanente de armamento: 1 pistola, 3 cargadores y 50 municiones calibre 9 mm."
          : isShotgunProvision
            ? `Provisión temporaria de escopeta: 1 escopeta y ${shotgunProvisionStatus.ammunition} unidades de ${shotgunProvisionStatus.ammunitionName || "munición calibre 12"}.`
            : "";

      const finalObservations =
        [
          automaticObservation,
          userObservation,
        ]
          .filter(Boolean)
          .join("\n");

      const created =
        await createAssignment({
          personnelId:
            person.id,

          type:
            assignmentType,

          details,

          observations:
            finalObservations,
        });

      if (onCreated) {
        await onCreated(
          created,
        );
      }

      onClose();
    } catch (
      saveError
    ) {
      const detailMessage =
        saveError
          .details?.[0]
          ?.message;

      setError(
        detailMessage ||
          saveError.message ||
          "No se pudo registrar la asignación",
      );
    } finally {
      setIsSaving(
        false,
      );
    }
  };

  if (
    !isOpen ||
    !person
  ) {
    return null;
  }

  const fullName = [
    person.firstName,
    person.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/40 px-4 py-6 backdrop-blur-[2px]">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* HEADER */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              Asignar equipamiento
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {fullName}

              {person.fileNumber
                ? ` · Legajo ${person.fileNumber}`
                : ""}
            </p>
          </div>

          <button
            type="button"
            onClick={
              handleClose
            }
            disabled={
              isSaving
            }
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={
            handleSubmit
          }
          className="overflow-y-auto"
        >
          <div className="space-y-6 px-6 py-6">
            {/* TIPO DE ASIGNACIÓN */}
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-700">
                  Tipo de asignación
                </p>

                {enforcedAssignmentType && (
                  <span className="rounded-full bg-[#edf3f8] px-2.5 py-1 text-xs font-medium text-[#163b65]">
                    Definida automáticamente
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* PERMANENTE */}
                <button
                  type="button"
                  disabled={
                    Boolean(
                      enforcedAssignmentType &&
                        enforcedAssignmentType !==
                          "PERMANENT",
                    )
                  }
                  onClick={() =>
                    handleAssignmentTypeChange(
                      "PERMANENT",
                    )
                  }
                  className={`rounded-xl border p-4 text-left transition ${
                    assignmentType ===
                    "PERMANENT"
                      ? "border-[#163b65] bg-[#edf3f8]"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  } ${
                    enforcedAssignmentType &&
                    enforcedAssignmentType !==
                      "PERMANENT"
                      ? "cursor-not-allowed opacity-45"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Permanente
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Permanece en poder del oficial.
                      </p>
                    </div>

                    {assignmentType ===
                      "PERMANENT" && (
                      <Check
                        size={18}
                        className="text-[#163b65]"
                      />
                    )}
                  </div>
                </button>

                {/* TEMPORARIA */}
                <button
                  type="button"
                  disabled={
                    Boolean(
                      enforcedAssignmentType &&
                        enforcedAssignmentType !==
                          "TEMPORARY",
                    )
                  }
                  onClick={() =>
                    handleAssignmentTypeChange(
                      "TEMPORARY",
                    )
                  }
                  className={`rounded-xl border p-4 text-left transition ${
                    assignmentType ===
                    "TEMPORARY"
                      ? "border-[#163b65] bg-[#edf3f8]"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  } ${
                    enforcedAssignmentType &&
                    enforcedAssignmentType !==
                      "TEMPORARY"
                      ? "cursor-not-allowed opacity-45"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Temporaria
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Asignado al oficial y resguardado en Sala de Armas.
                      </p>
                    </div>

                    {assignmentType ===
                      "TEMPORARY" && (
                      <Check
                        size={18}
                        className="text-[#163b65]"
                      />
                    )}
                  </div>
                </button>
              </div>

              {enforcedAssignmentType && (
                <div className="mt-3 rounded-xl border border-[#163b65]/10 bg-[#edf3f8] px-4 py-3">
                  <p className="text-xs font-medium text-[#163b65]">
                    Modalidad determinada por el tipo de equipamiento
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    El equipamiento seleccionado está configurado como{" "}
                    <strong>
                      {getAssignmentTypeLabel(
                        enforcedAssignmentType,
                      )}
                    </strong>
                    .
                  </p>
                </div>
              )}
            </div>

            {/* INFORMACIÓN TEMPORARIA */}
            {assignmentType ===
              "TEMPORARY" && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-amber-700 shadow-sm">
                    <Package
                      size={18}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      Asignación temporaria
                    </p>

                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                      El equipamiento queda asignado a esta persona, pero su resguardo habitual es Sala de Armas.
                    </p>

                    {selectedEquipment.some(
                      isShotgunEquipment,
                    ) && (
                      <p className="mt-2 text-xs font-medium text-amber-700">
                        La escopeta se administra bajo esta modalidad.
                      </p>
                    )}

                    <div className="mt-3 rounded-lg bg-white px-3 py-2">
                      <p className="text-xs text-slate-400">
                        Situación logística
                      </p>

                      <p className="mt-1 text-sm font-semibold text-amber-700">
                        Sala de Armas
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PROVISIÓN DE ESCOPETA */}
            {isShotgunProvision && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-amber-700 shadow-sm">
                    <ShieldCheck
                      size={18}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      Provisión temporaria de escopeta
                    </p>

                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                      Seleccioná expresamente el tipo de munición calibre 12 y luego la cantidad a entregar.
                    </p>

                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div className="rounded-lg bg-white px-3 py-2">
                        <p className="text-xs text-slate-400">
                          Escopeta
                        </p>

                        <p className="mt-1 text-sm font-semibold text-emerald-700">
                          1 seleccionada
                        </p>
                      </div>

                      <div className="rounded-lg bg-white px-3 py-2">
                        <p className="text-xs text-slate-400">
                          Munición seleccionada
                        </p>

                        <p
                          className={`mt-1 text-sm font-semibold ${
                            shotgunProvisionStatus.ammunitionId
                              ? "text-amber-700"
                              : "text-slate-400"
                          }`}
                        >
                          {shotgunProvisionStatus.ammunitionId
                            ? `${shotgunProvisionStatus.ammunitionName} · ${shotgunProvisionStatus.ammunition}`
                            : "Sin seleccionar"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs font-medium text-slate-700">
                        Tipo de munición calibre 12
                      </p>

                      {twelveGaugeAmmunitionStocks.length >
                      0 ? (
                        <div className="mt-2 grid grid-cols-1 gap-2">
                          {twelveGaugeAmmunitionStocks.map(
                            (ammunition) => {
                              const selected =
                                shotgunProvisionStatus.ammunitionId ===
                                ammunition.id;

                              const disabled =
                                ammunition.availableQuantity <
                                  DEFAULT_SHOTGUN_AMMUNITION ||
                                isSaving;

                              return (
                                <button
                                  key={
                                    ammunition.id
                                  }
                                  type="button"
                                  disabled={
                                    disabled
                                  }
                                  onClick={() =>
                                    handleShotgunAmmunitionTypeChange(
                                      ammunition.id,
                                    )
                                  }
                                  className={`rounded-xl border px-3.5 py-3 text-left transition ${
                                    selected
                                      ? "border-amber-500 bg-white ring-2 ring-amber-500/10"
                                      : "border-amber-200 bg-white hover:border-amber-300"
                                  } disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60`}
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                      <p className="text-sm font-semibold text-slate-800">
                                        {ammunition.type?.name ||
                                          "Munición calibre 12"}
                                      </p>

                                      {(ammunition.brand ||
                                        ammunition.model) && (
                                        <p className="mt-1 text-xs text-slate-500">
                                          {[
                                            ammunition.brand,
                                            ammunition.model,
                                          ]
                                            .filter(Boolean)
                                            .join(" ")}
                                        </p>
                                      )}
                                    </div>

                                    <span
                                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                        selected
                                          ? "bg-amber-100 text-amber-800"
                                          : "bg-slate-100 text-slate-600"
                                      }`}
                                    >
                                      Disponibles:{" "}
                                      {
                                        ammunition.availableQuantity
                                      }
                                    </span>
                                  </div>

                                  {ammunition.availableQuantity <
                                    DEFAULT_SHOTGUN_AMMUNITION && (
                                    <p className="mt-2 text-xs font-medium text-red-600">
                                      Stock inferior al mínimo de{" "}
                                      {
                                        DEFAULT_SHOTGUN_AMMUNITION
                                      }
                                      .
                                    </p>
                                  )}
                                </button>
                              );
                            },
                          )}
                        </div>
                      ) : (
                        <div className="mt-2 rounded-lg border border-red-100 bg-white px-3 py-2.5">
                          <p className="text-xs font-medium text-red-700">
                            No hay stock disponible de munición calibre 12.
                          </p>
                        </div>
                      )}

                      <p className="mt-2 text-xs text-slate-500">
                        Elegí, por ejemplo, munición convencional o posta de goma. SIGEP no seleccionará un tipo automáticamente.
                      </p>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs font-medium text-slate-700">
                        Cantidad
                      </p>

                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {SHOTGUN_AMMUNITION_OPTIONS.map(
                          (quantity) => {
                            const disabled =
                              !shotgunProvisionStatus.ammunitionId ||
                              shotgunProvisionStatus.availableQuantity <
                                quantity ||
                              isSaving;

                            return (
                              <button
                                key={
                                  quantity
                                }
                                type="button"
                                disabled={
                                  disabled
                                }
                                onClick={() =>
                                  handleShotgunAmmunitionChange(
                                    quantity,
                                  )
                                }
                                className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${
                                  shotgunProvisionStatus.ammunition ===
                                  quantity
                                    ? "border-amber-500 bg-white text-amber-800 ring-2 ring-amber-500/10"
                                    : "border-amber-200 bg-white text-slate-700 hover:border-amber-300"
                                } disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`}
                              >
                                {quantity}
                              </button>
                            );
                          },
                        )}
                      </div>

                      <p className="mt-2 text-xs text-slate-500">
                        Seleccioná 10, 15 o 20 cartuchos según la provisión correspondiente.
                      </p>
                    </div>

                    {!shotgunProvisionStatus.complete && (
                      <p className="mt-3 text-xs font-medium text-red-700">
                        Seleccioná el tipo de munición y una cantidad válida para registrar la provisión.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PROVISIÓN DE PISTOLA */}
            {isPistolProvision && (
              <div className="rounded-xl border border-[#163b65]/15 bg-[#f5f8fb] p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#163b65] shadow-sm">
                    <ShieldCheck
                      size={18}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      Provisión permanente de pistola
                    </p>

                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      SIGEP agrupa la pistola y su dotación dentro de una única asignación.
                    </p>

                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <div className="rounded-lg bg-white px-3 py-2">
                        <p className="text-xs text-slate-400">
                          Pistola
                        </p>

                        <p className="mt-1 text-sm font-semibold text-emerald-700">
                          1 seleccionada
                        </p>
                      </div>

                      <div className="rounded-lg bg-white px-3 py-2">
                        <p className="text-xs text-slate-400">
                          Cargadores
                        </p>

                        <p
                          className={`mt-1 text-sm font-semibold ${
                            provisionStatus.magazines ===
                            STANDARD_MAGAZINES
                              ? "text-emerald-700"
                              : "text-amber-700"
                          }`}
                        >
                          {
                            provisionStatus.magazines
                          }
                          {" / "}
                          {
                            STANDARD_MAGAZINES
                          }
                        </p>
                      </div>

                      <div className="rounded-lg bg-white px-3 py-2">
                        <p className="text-xs text-slate-400">
                          Municiones 9 mm
                        </p>

                        <p
                          className={`mt-1 text-sm font-semibold ${
                            provisionStatus.ammunition ===
                            STANDARD_AMMUNITION
                              ? "text-emerald-700"
                              : "text-amber-700"
                          }`}
                        >
                          {
                            provisionStatus.ammunition
                          }
                          {" / "}
                          {
                            STANDARD_AMMUNITION
                          }
                        </p>
                      </div>
                    </div>

                    {!provisionStatus.complete && (
                      <p className="mt-3 text-xs font-medium text-amber-700">
                        La dotación debe estar completa para registrar la provisión.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* EQUIPAMIENTO */}
            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Equipamiento disponible
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {isPistolProvision
                      ? "La dotación asociada a la pistola se selecciona automáticamente."
                      : isShotgunProvision
                        ? "Elegí el tipo y la cantidad de munición calibre 12 desde la provisión de escopeta."
                        : "Podés seleccionar uno o varios elementos compatibles con la misma modalidad."}
                  </p>
                </div>

                {selectedCount >
                  0 && (
                  <span className="rounded-full bg-[#edf3f8] px-3 py-1 text-xs font-medium text-[#163b65]">
                    {
                      selectedCount
                    }{" "}
                    seleccionado
                    {selectedCount !==
                    1
                      ? "s"
                      : ""}
                  </span>
                )}
              </div>

              {isLoading ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                  Cargando equipamiento...
                </div>
              ) : availableEquipment.length ===
                0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-start gap-3">
                    <Package
                      size={20}
                      className="mt-0.5 text-slate-400"
                    />

                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        No hay equipamiento disponible
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Actualmente no existen elementos con stock disponible para asignar.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableEquipment.map(
                    (item) => {
                      const selectedItem =
                        selectedItems[
                          item.id
                        ];

                      const selected =
                        Boolean(
                          selectedItem
                            ?.selected,
                        );

                      const isIndividual =
                        item.type
                          ?.trackingMode ===
                        "INDIVIDUAL";

                      const autoAdded =
                        Boolean(
                          selectedItem
                            ?.autoAdded,
                        );

                      const itemDefaultAssignmentType =
                        getDefaultAssignmentType(
                          item,
                        );

                      /*
                       * Durante una provisión
                       * de pistola el resto del
                       * equipamiento queda
                       * bloqueado.
                       */
                      const disabledByPistolProvision =
                        isPistolProvision &&
                        !selected &&
                        !isPistolEquipment(
                          item,
                        );

                      const disabledByShotgunProvision =
                        isShotgunProvision &&
                        !selected &&
                        !isShotgunEquipment(
                          item,
                        );

                      const disabledByProvision =
                        disabledByPistolProvision ||
                        disabledByShotgunProvision;

                      return (
                        <div
                          key={
                            item.id
                          }
                          className={`rounded-xl border p-4 transition ${
                            selected
                              ? "border-[#163b65] bg-[#f5f8fb]"
                              : disabledByProvision
                                ? "border-slate-100 bg-slate-50 opacity-60"
                                : "border-slate-200 bg-white"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleEquipment(
                                  item,
                                )
                              }
                              disabled={
                                disabledByProvision
                              }
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
                                selected
                                  ? "border-[#163b65] bg-[#163b65] text-white"
                                  : "border-slate-300 bg-white"
                              } disabled:cursor-not-allowed`}
                              aria-label="Seleccionar equipamiento"
                            >
                              {selected && (
                                <Check
                                  size={14}
                                />
                              )}
                            </button>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="wrap-break-word text-sm font-semibold text-slate-900">
                                    {
                                      item.type
                                        ?.name
                                    }

                                    {item.brand
                                      ? ` ${item.brand}`
                                      : ""}

                                    {item.model
                                      ? ` ${item.model}`
                                      : ""}
                                  </p>

                                  <p className="mt-1 text-xs text-slate-500">
                                    {isIndividual
                                      ? item.serialNumber
                                        ? `Serie ${item.serialNumber}`
                                        : item.inventoryNumber
                                          ? `Inventario ${item.inventoryNumber}`
                                          : "Sin identificación"
                                      : `Disponibles: ${item.availableQuantity}`}
                                  </p>
                                </div>

                                <div className="flex flex-wrap items-center justify-end gap-2">
                                  {autoAdded && (
                                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                      Dotación automática
                                    </span>
                                  )}

                                  {isArmamentEquipment(
                                    item,
                                  ) && (
                                    <span className="rounded-full bg-[#edf3f8] px-2.5 py-1 text-xs font-medium text-[#163b65]">
                                      Armamento
                                    </span>
                                  )}

                                  {itemDefaultAssignmentType && (
                                    <span
                                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                        itemDefaultAssignmentType ===
                                        "PERMANENT"
                                          ? "bg-emerald-50 text-emerald-700"
                                          : "bg-amber-50 text-amber-700"
                                      }`}
                                    >
                                      {getAssignmentTypeLabel(
                                        itemDefaultAssignmentType,
                                      )}
                                    </span>
                                  )}

                                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                    {isIndividual
                                      ? "Individual"
                                      : "Por cantidad"}
                                  </span>
                                </div>
                              </div>

                              {selected &&
                                !isIndividual && (
                                  <div className="mt-4 max-w-44">
                                    <label
                                      htmlFor={`quantity-${item.id}`}
                                      className="mb-1.5 block text-xs font-medium text-slate-600"
                                    >
                                      Cantidad
                                    </label>

                                    <input
                                      id={`quantity-${item.id}`}
                                      type="number"
                                      min="1"
                                      max={
                                        item.availableQuantity
                                      }
                                      value={
                                        selectedItems[
                                          item.id
                                        ]
                                          ?.quantity ??
                                        1
                                      }
                                      onChange={(
                                        event,
                                      ) =>
                                        handleQuantityChange(
                                          item,
                                          event
                                            .target
                                            .value,
                                        )
                                      }
                                      disabled={
                                        autoAdded
                                      }
                                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#7394b2] focus:ring-4 focus:ring-[#163b65]/5 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                                    />

                                    <p className="mt-1 text-xs text-slate-400">
                                      {autoAdded
                                        ? "Cantidad definida por la dotación estándar."
                                        : `Máximo: ${item.availableQuantity}`}
                                    </p>
                                  </div>
                                )}
                            </div>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              )}
            </div>

            {/* OBSERVACIONES */}
            <div>
              <label
                htmlFor="assignmentObservations"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Observaciones
              </label>

              <textarea
                id="assignmentObservations"
                rows={3}
                value={
                  observations
                }
                onChange={(
                  event,
                ) =>
                  setObservations(
                    event.target
                      .value,
                  )
                }
                placeholder="Información adicional sobre la asignación..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#7394b2] focus:ring-4 focus:ring-[#163b65]/5"
              />
            </div>

            {/* ERROR */}
            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                <p className="text-sm font-medium text-red-700">
                  {error}
                </p>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
            <button
              type="button"
              onClick={
                handleClose
              }
              disabled={
                isSaving
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={
                isSaving ||
                isLoading ||
                availableEquipment.length ===
                  0 ||
                (
                  isPistolProvision &&
                  !provisionStatus.complete
                ) ||
                (
                  isShotgunProvision &&
                  !shotgunProvisionStatus.complete
                )
              }
              className="inline-flex items-center gap-2 rounded-xl bg-[#163b65] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#123252] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus
                size={17}
              />

              {isSaving
                ? "Asignando..."
                : isPistolProvision ||
                    isShotgunProvision
                  ? "Registrar provisión"
                  : "Registrar asignación"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PersonnelAssignmentModal;