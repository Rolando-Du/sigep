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

const normalizeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const getDefaultAssignmentType = (item) =>
  item?.type?.defaultAssignmentType || null;

const getAssignmentTypeLabel = (type) => {
  if (type === "PERMANENT") {
    return "Permanente";
  }

  if (type === "TEMPORARY") {
    return "Temporaria";
  }

  return "Sin modalidad";
};

// EQUIPAMIENTO
const isArmamentEquipment = (item) =>
  item?.type?.category === "ARMAMENTO";

const isPistolEquipment = (item) => {
  if (!isArmamentEquipment(item)) {
    return false;
  }

  return normalizeText(
    item?.type?.name,
  ).includes("pistola");
};

const isShotgunEquipment = (item) => {
  if (!isArmamentEquipment(item)) {
    return false;
  }

  return normalizeText(
    item?.type?.name,
  ).includes("escopeta");
};

const isBallisticVestEquipment = (item) => {
  const typeName = normalizeText(
    item?.type?.name,
  );

  return (
    item?.type?.category === "PROTECCION" &&
    typeName.includes("chaleco")
  );
};

const isMagazineEquipment = (item) => {
  const typeName = normalizeText(
    item?.type?.name,
  );

  return (
    item?.type?.category === "ACCESORIO" &&
    typeName.includes("cargador")
  );
};

const isAmmunitionEquipment = (item) => {
  const typeName = normalizeText(
    item?.type?.name,
  );

  return (
    item?.type?.category === "MUNICION" ||
    typeName.includes("municion") ||
    typeName.includes("cartucho")
  );
};

const isNineMillimeterAmmunition = (item) => {
  if (!isAmmunitionEquipment(item)) {
    return false;
  }

  const searchableText = normalizeText(
    [
      item?.type?.name,
      item?.type?.description,
      item?.brand,
      item?.model,
      item?.observations,
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

const isPersonnelAssignableEquipment = (item) =>
  isPistolEquipment(item) ||
  isBallisticVestEquipment(item);

const findMagazineStock = (equipment) =>
  equipment.find(
    (item) =>
      isMagazineEquipment(item) &&
      item.type?.trackingMode === "QUANTITY" &&
      item.status === "DISPONIBLE" &&
      item.availableQuantity >=
        STANDARD_MAGAZINES,
  );

const findAmmunitionStock = (equipment) =>
  equipment.find(
    (item) =>
      isNineMillimeterAmmunition(item) &&
      item.type?.trackingMode === "QUANTITY" &&
      item.status === "DISPONIBLE" &&
      item.availableQuantity >=
        STANDARD_AMMUNITION,
  );

const PersonnelAssignmentModal = ({
  isOpen,
  onClose,
  person,
  onCreated,
}) => {
  const [equipment, setEquipment] =
    useState([]);
  const [assignmentType, setAssignmentType] =
    useState("PERMANENT");
  const [selectedItems, setSelectedItems] =
    useState({});
  const [observations, setObservations] =
    useState("");
  const [isLoading, setIsLoading] =
    useState(false);
  const [isSaving, setIsSaving] =
    useState(false);
  const [error, setError] = useState("");

  // CARGA
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let ignore = false;

    const loadEquipment = async () => {
      try {
        setIsLoading(true);
        setError("");

        const data = await getEquipment();

        if (!ignore) {
          setEquipment(
            Array.isArray(data) ? data : [],
          );
        }
      } catch (loadError) {
        if (!ignore) {
          setEquipment([]);
          setError(
            loadError.message ||
              "No se pudo obtener el equipamiento disponible",
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    setAssignmentType("PERMANENT");
    setSelectedItems({});
    setObservations("");
    setError("");
    loadEquipment();

    return () => {
      ignore = true;
    };
  }, [isOpen]);

  // STOCK DISPONIBLE
  const stockEquipment = useMemo(
    () =>
      equipment.filter(
        (item) =>
          item.type?.isActive &&
          item.status === "DISPONIBLE" &&
          item.availableQuantity > 0,
      ),
    [equipment],
  );

  // EQUIPAMIENTO ASIGNABLE
  const availableEquipment = useMemo(
    () =>
      stockEquipment.filter(
        isPersonnelAssignableEquipment,
      ),
    [stockEquipment],
  );

  // SELECCIÓN
  const selectedEquipment = useMemo(
    () =>
      stockEquipment.filter(
        (item) =>
          selectedItems[item.id]?.selected,
      ),
    [stockEquipment, selectedItems],
  );

  const selectedDefaultAssignmentTypes =
    useMemo(
      () => [
        ...new Set(
          selectedEquipment
            .map(getDefaultAssignmentType)
            .filter(Boolean),
        ),
      ],
      [selectedEquipment],
    );

  const enforcedAssignmentType =
    selectedDefaultAssignmentTypes.length === 1
      ? selectedDefaultAssignmentTypes[0]
      : null;

  useEffect(() => {
    if (
      enforcedAssignmentType &&
      assignmentType !== enforcedAssignmentType
    ) {
      setAssignmentType(
        enforcedAssignmentType,
      );
    }
  }, [
    enforcedAssignmentType,
    assignmentType,
  ]);

  const selectedPistol = useMemo(
    () =>
      selectedEquipment.find(
        isPistolEquipment,
      ),
    [selectedEquipment],
  );

  const selectedBallisticVest = useMemo(
    () =>
      selectedEquipment.find(
        isBallisticVestEquipment,
      ),
    [selectedEquipment],
  );

  const isPistolProvision =
    assignmentType === "PERMANENT" &&
    Boolean(selectedPistol);

  const selectedCount = useMemo(
    () =>
      availableEquipment.filter(
        (item) =>
          selectedItems[item.id]?.selected,
      ).length,
    [availableEquipment, selectedItems],
  );

  // DOTACIÓN DE PISTOLA
  const provisionStatus = useMemo(() => {
    if (!isPistolProvision) {
      return {
        magazines: 0,
        ammunition: 0,
        complete: true,
      };
    }

    const magazine = stockEquipment.find(
      (item) =>
        isMagazineEquipment(item) &&
        selectedItems[item.id]?.role ===
          "MAGAZINE",
    );

    const ammunition = stockEquipment.find(
      (item) =>
        isNineMillimeterAmmunition(item) &&
        selectedItems[item.id]?.role ===
          "AMMUNITION",
    );

    const magazines = magazine
      ? Number(
          selectedItems[magazine.id]?.quantity,
        ) || 0
      : 0;

    const ammunitionQuantity = ammunition
      ? Number(
          selectedItems[ammunition.id]
            ?.quantity,
        ) || 0
      : 0;

    return {
      magazines,
      ammunition: ammunitionQuantity,
      complete:
        magazines === STANDARD_MAGAZINES &&
        ammunitionQuantity ===
          STANDARD_AMMUNITION,
    };
  }, [
    stockEquipment,
    selectedItems,
    isPistolProvision,
  ]);

  // CREAR DOTACIÓN DE PISTOLA
  const createPistolProvisionSelection = (
    pistol,
  ) => {
    const magazine = findMagazineStock(
      stockEquipment,
    );

    const ammunition = findAmmunitionStock(
      stockEquipment,
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
      next[magazine.id] = {
        selected: true,
        quantity: STANDARD_MAGAZINES,
        role: "MAGAZINE",
        autoAdded: true,
      };
    }

    if (ammunition) {
      next[ammunition.id] = {
        selected: true,
        quantity: STANDARD_AMMUNITION,
        role: "AMMUNITION",
        autoAdded: true,
      };
    }

    setSelectedItems(next);

    if (!magazine && !ammunition) {
      setError(
        `La provisión requiere ${STANDARD_MAGAZINES} cargadores y ${STANDARD_AMMUNITION} municiones 9 mm disponibles.`,
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

  // MODALIDAD
  const handleAssignmentTypeChange = (
    nextType,
  ) => {
    if (
      isSaving ||
      nextType === assignmentType
    ) {
      return;
    }

    if (
      enforcedAssignmentType &&
      nextType !== enforcedAssignmentType
    ) {
      setError(
        `La modalidad está definida automáticamente por el equipamiento seleccionado: ${getAssignmentTypeLabel(
          enforcedAssignmentType,
        )}.`,
      );
      return;
    }

    setAssignmentType(nextType);
    setError("");
  };

  // SELECCIÓN
  const handleToggleEquipment = (item) => {
    const currentItem = selectedItems[item.id];

    if (currentItem?.selected) {
      if (isPistolEquipment(item)) {
        setSelectedItems({});
        setError("");
        return;
      }

      setSelectedItems((current) => {
        const next = {
          ...current,
        };

        delete next[item.id];
        return next;
      });

      setError("");
      return;
    }

    const itemDefaultAssignmentType =
      getDefaultAssignmentType(item);

    if (
      itemDefaultAssignmentType &&
      selectedDefaultAssignmentTypes.length > 0 &&
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

    if (isPistolEquipment(item)) {
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

      if (selectedCount > 0) {
        setError(
          "La provisión de pistola debe registrarse separada de otros equipos.",
        );
        return;
      }

      setAssignmentType("PERMANENT");
      createPistolProvisionSelection(item);
      return;
    }

    if (isBallisticVestEquipment(item)) {
      if (
        itemDefaultAssignmentType &&
        itemDefaultAssignmentType !==
          "TEMPORARY"
      ) {
        setError(
          "El tipo Chaleco Balístico está configurado incorrectamente. Debe utilizar asignación Temporaria.",
        );
        return;
      }

      setAssignmentType("TEMPORARY");
    }

    if (isPistolProvision) {
      setError(
        "La provisión de pistola debe registrarse separada de otros equipos.",
      );
      return;
    }

    if (itemDefaultAssignmentType) {
      setAssignmentType(
        itemDefaultAssignmentType,
      );
    }

    setSelectedItems((current) => ({
      ...current,
      [item.id]: {
        selected: true,
        quantity: 1,
        autoAdded: false,
      },
    }));

    setError("");
  };

  // CANTIDAD
  const handleQuantityChange = (
    item,
    value,
  ) => {
    const quantity = Number(value);

    setSelectedItems((current) => ({
      ...current,
      [item.id]: {
        ...current[item.id],
        selected: true,
        quantity: Number.isFinite(quantity)
          ? quantity
          : 1,
      },
    }));
  };

  // CERRAR
  const handleClose = () => {
    if (isSaving) {
      return;
    }

    onClose();
  };

  // GUARDAR
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!person?.id || isSaving) {
      return;
    }

    const details = Object.entries(
      selectedItems,
    )
      .filter(([, item]) => item.selected)
      .map(([equipmentId, item]) => ({
        equipmentId: Number(equipmentId),
        quantity: Number(item.quantity),
      }));

    if (details.length === 0) {
      setError(
        "Seleccioná al menos un equipamiento",
      );
      return;
    }

    if (
      selectedDefaultAssignmentTypes.length > 1
    ) {
      setError(
        "Los equipos seleccionados requieren modalidades de asignación diferentes.",
      );
      return;
    }

    if (
      enforcedAssignmentType &&
      assignmentType !== enforcedAssignmentType
    ) {
      setError(
        `La modalidad correcta para el equipamiento seleccionado es ${getAssignmentTypeLabel(
          enforcedAssignmentType,
        )}.`,
      );
      return;
    }

    if (
      selectedPistol &&
      assignmentType !== "PERMANENT"
    ) {
      setError(
        "La pistola debe registrarse como asignación Permanente.",
      );
      return;
    }

    if (
      selectedBallisticVest &&
      assignmentType !== "TEMPORARY"
    ) {
      setError(
        "El chaleco balístico debe registrarse como asignación Temporaria.",
      );
      return;
    }

    if (
      isPistolProvision &&
      provisionStatus.magazines !==
        STANDARD_MAGAZINES
    ) {
      setError(
        `La provisión permanente debe incluir exactamente ${STANDARD_MAGAZINES} cargadores.`,
      );
      return;
    }

    if (
      isPistolProvision &&
      provisionStatus.ammunition !==
        STANDARD_AMMUNITION
    ) {
      setError(
        `La provisión permanente debe incluir exactamente ${STANDARD_AMMUNITION} municiones 9 mm.`,
      );
      return;
    }

    const invalidDetail = details.find(
      (detail) =>
        !Number.isInteger(detail.quantity) ||
        detail.quantity <= 0,
    );

    if (invalidDetail) {
      setError(
        "Las cantidades seleccionadas no son válidas",
      );
      return;
    }

    try {
      setIsSaving(true);
      setError("");

      const userObservation =
        observations.trim();

      const automaticObservation =
        isPistolProvision
          ? "Provisión permanente de pistola: 1 pistola, 3 cargadores y 50 municiones calibre 9 mm."
          : "";

      const finalObservations = [
        automaticObservation,
        userObservation,
      ]
        .filter(Boolean)
        .join("\n");

      const created = await createAssignment({
        personnelId: person.id,
        type: assignmentType,
        details,
        observations: finalObservations,
      });

      if (onCreated) {
        await onCreated(created);
      }

      onClose();
    } catch (saveError) {
      const detailMessage =
        saveError.details?.[0]?.message;

      setError(
        detailMessage ||
          saveError.message ||
          "No se pudo registrar la asignación",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !person) {
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
            onClick={handleClose}
            disabled={isSaving}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto"
        >
          <div className="space-y-6 px-6 py-6">
            {/* MODALIDAD */}
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
                <button
                  type="button"
                  disabled={Boolean(
                    enforcedAssignmentType &&
                      enforcedAssignmentType !==
                        "PERMANENT",
                  )}
                  onClick={() =>
                    handleAssignmentTypeChange(
                      "PERMANENT",
                    )
                  }
                  className={`rounded-xl border p-4 text-left transition ${
                    assignmentType === "PERMANENT"
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

                <button
                  type="button"
                  disabled={Boolean(
                    enforcedAssignmentType &&
                      enforcedAssignmentType !==
                        "TEMPORARY",
                  )}
                  onClick={() =>
                    handleAssignmentTypeChange(
                      "TEMPORARY",
                    )
                  }
                  className={`rounded-xl border p-4 text-left transition ${
                    assignmentType === "TEMPORARY"
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
                        Se resguarda habitualmente en Sala de Armas.
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
            </div>

            {/* SITUACIÓN LOGÍSTICA */}
            {assignmentType ===
              "TEMPORARY" && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-amber-700 shadow-sm">
                    <Package size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Asignación temporaria
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                      El elemento queda asignado a la persona y se resguarda en Sala de Armas cuando no está en uso.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* PROVISIÓN DE PISTOLA */}
            {isPistolProvision && (
              <div className="rounded-xl border border-[#163b65]/15 bg-[#f5f8fb] p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#163b65] shadow-sm">
                    <ShieldCheck size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      Provisión permanente de pistola
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
                          {provisionStatus.magazines}
                          {" / "}
                          {STANDARD_MAGAZINES}
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
                          {provisionStatus.ammunition}
                          {" / "}
                          {STANDARD_AMMUNITION}
                        </p>
                      </div>
                    </div>

                    {!provisionStatus.complete && (
                      <p className="mt-3 text-xs font-medium text-amber-700">
                        Se requieren 3 cargadores y 50 municiones 9 mm para completar la provisión.
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
                      ? "La pistola incluye automáticamente 3 cargadores y 50 municiones 9 mm."
                      : "Solo Pistola y Chaleco Balístico se asignan al personal. El resto se administra como stock general."}
                  </p>
                </div>

                {selectedCount > 0 && (
                  <span className="rounded-full bg-[#edf3f8] px-3 py-1 text-xs font-medium text-[#163b65]">
                    {selectedCount} seleccionado
                    {selectedCount !== 1 ? "s" : ""}
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
                        No hay equipamiento asignable disponible
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Actualmente no existen elementos disponibles para asignar al personal.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableEquipment.map(
                    (item) => {
                      const selectedItem =
                        selectedItems[item.id];

                      const selected = Boolean(
                        selectedItem?.selected,
                      );

                      const isIndividual =
                        item.type?.trackingMode ===
                        "INDIVIDUAL";

                      const itemDefaultAssignmentType =
                        getDefaultAssignmentType(
                          item,
                        );

                      const disabledByPistolProvision =
                        isPistolProvision &&
                        !selected &&
                        !isPistolEquipment(item);

                      return (
                        <div
                          key={item.id}
                          className={`rounded-xl border p-4 transition ${
                            selected
                              ? "border-[#163b65] bg-[#f5f8fb]"
                              : disabledByPistolProvision
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
                                disabledByPistolProvision
                              }
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
                                selected
                                  ? "border-[#163b65] bg-[#163b65] text-white"
                                  : "border-slate-300 bg-white"
                              } disabled:cursor-not-allowed`}
                              aria-label="Seleccionar equipamiento"
                            >
                              {selected && (
                                <Check size={14} />
                              )}
                            </button>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="wrap-break-word text-sm font-semibold text-slate-900">
                                    {item.type?.name}
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
                                        ]?.quantity ?? 1
                                      }
                                      onChange={(event) =>
                                        handleQuantityChange(
                                          item,
                                          event.target.value,
                                        )
                                      }
                                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#7394b2] focus:ring-4 focus:ring-[#163b65]/5"
                                    />

                                    <p className="mt-1 text-xs text-slate-400">
                                      Máximo: {item.availableQuantity}
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
                rows={4}
                value={observations}
                onChange={(event) =>
                  setObservations(
                    event.target.value,
                  )
                }
                placeholder="Ej. Se entrega con estuche de transporte, baqueta y manual de usuario."
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
              onClick={handleClose}
              disabled={isSaving}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={
                isSaving ||
                isLoading ||
                availableEquipment.length === 0 ||
                (isPistolProvision &&
                  !provisionStatus.complete)
              }
              className="inline-flex items-center gap-2 rounded-xl bg-[#163b65] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#123252] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={17} />

              {isSaving
                ? "Asignando..."
                : isPistolProvision
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