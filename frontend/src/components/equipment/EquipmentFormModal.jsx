import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Boxes,
  Package,
  Plus,
  Save,
  Tags,
  X,
} from "lucide-react";

const inputClasses =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#7394b2] focus:ring-4 focus:ring-[#163b65]/5";

const EQUIPMENT_STATUSES = [
  {
    value: "DISPONIBLE",
    label: "Disponible",
  },
  {
    value: "EN_CUSTODIA",
    label: "En custodia",
  },
  {
    value: "EN_REPARACION",
    label: "En reparación",
  },
  {
    value: "FUERA_DE_SERVICIO",
    label: "Fuera de servicio",
  },
  {
    value: "BAJA",
    label: "Baja",
  },
];

const EQUIPMENT_CATEGORIES = [
  {
    value: "ARMAMENTO",
    label: "Armamento",
  },
  {
    value: "PROTECCION",
    label: "Protección",
  },
  {
    value: "COMUNICACIONES",
    label: "Comunicaciones",
  },
  {
    value: "MUNICION",
    label: "Munición",
  },
  {
    value: "ACCESORIO",
    label: "Accesorios",
  },
  {
    value: "OTRO",
    label: "Otros",
  },
];

const getCategoryLabel = (
  category,
) => {
  return (
    EQUIPMENT_CATEGORIES.find(
      (item) =>
        item.value === category,
    )?.label ||
    "Otros"
  );
};

const getAssignmentTypeLabel = (
  type,
) => {
  if (
    type === "PERMANENT"
  ) {
    return "Permanente";
  }

  if (
    type === "TEMPORARY"
  ) {
    return "Temporaria";
  }

  return "Sin modalidad predeterminada";
};

const getAssignmentTypeDescription = (
  type,
) => {
  if (
    type === "PERMANENT"
  ) {
    return "Cuando se asigne, permanecerá normalmente en poder del oficial.";
  }

  if (
    type === "TEMPORARY"
  ) {
    return "Cuando se asigne, permanecerá normalmente resguardado en Sala de Armas.";
  }

  return "La modalidad se definirá según la asignación correspondiente.";
};

const EquipmentFormModal = ({
  isOpen,
  onClose,
  equipmentTypes = [],
  onSave,
  isSaving = false,
  equipmentToEdit = null,
}) => {
  const isEditing =
    Boolean(
      equipmentToEdit?.id,
    );

  const activeTypes =
    useMemo(
      () =>
        equipmentTypes.filter(
          (type) =>
            type.isActive,
        ),
      [equipmentTypes],
    );

  /*
   * Si estamos editando un equipo
   * cuyo tipo fue desactivado,
   * igualmente necesitamos mostrar
   * su tipo actual.
   */
  const selectableTypes =
    useMemo(() => {
      if (
        !isEditing ||
        !equipmentToEdit?.type
      ) {
        return activeTypes;
      }

      const currentTypeExists =
        activeTypes.some(
          (type) =>
            type.id ===
            equipmentToEdit.type.id,
        );

      if (currentTypeExists) {
        return activeTypes;
      }

      return [
        equipmentToEdit.type,
        ...activeTypes,
      ];
    }, [
      activeTypes,
      equipmentToEdit,
      isEditing,
    ]);

  /*
   * Agrupamos los tipos por categoría.
   *
   * Ejemplo:
   *
   * ARMAMENTO
   * - Pistola
   * - Escopeta
   *
   * PROTECCIÓN
   * - Chaleco Balístico
   */
  const groupedTypes =
    useMemo(() => {
      const groups =
        EQUIPMENT_CATEGORIES.map(
          (category) => ({
            ...category,

            types:
              selectableTypes.filter(
                (type) =>
                  (
                    type.category ||
                    "OTRO"
                  ) ===
                  category.value,
              ),
          }),
        ).filter(
          (group) =>
            group.types.length >
            0,
        );

      return groups;
    }, [
      selectableTypes,
    ]);

  const [
    typeId,
    setTypeId,
  ] = useState("");

  const [
    inventoryNumber,
    setInventoryNumber,
  ] = useState("");

  const [
    serialNumber,
    setSerialNumber,
  ] = useState("");

  const [
    brand,
    setBrand,
  ] = useState("");

  const [
    model,
    setModel,
  ] = useState("");

  const [
    status,
    setStatus,
  ] = useState(
    "DISPONIBLE",
  );

  const [
    totalQuantity,
    setTotalQuantity,
  ] = useState("1");

  const [
    observations,
    setObservations,
  ] = useState("");

  const [
    errors,
    setErrors,
  ] = useState({});

  const selectedType =
    selectableTypes.find(
      (type) =>
        type.id ===
        Number(typeId),
    ) || null;

  const isQuantity =
    selectedType
      ?.trackingMode ===
    "QUANTITY";

  const isArmament =
    selectedType?.category ===
    "ARMAMENTO";

  /*
   * Cargar datos al abrir.
   *
   * - Edición:
   *   carga los datos existentes.
   *
   * - Creación:
   *   inicia el formulario con
   *   el primer tipo disponible.
   */
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setErrors({});

    if (
      isEditing &&
      equipmentToEdit
    ) {
      setTypeId(
        String(
          equipmentToEdit.typeId ??
            equipmentToEdit
              .type?.id ??
            "",
        ),
      );

      setInventoryNumber(
        equipmentToEdit
          .inventoryNumber ||
          "",
      );

      setSerialNumber(
        equipmentToEdit
          .serialNumber ||
          "",
      );

      setBrand(
        equipmentToEdit.brand ||
          "",
      );

      setModel(
        equipmentToEdit.model ||
          "",
      );

      setStatus(
        equipmentToEdit.status ||
          "DISPONIBLE",
      );

      setTotalQuantity(
        String(
          equipmentToEdit
            .totalQuantity ??
            1,
        ),
      );

      setObservations(
        equipmentToEdit
          .observations ||
          "",
      );

      return;
    }

    setTypeId(
      selectableTypes.length >
      0
        ? String(
            selectableTypes[0]
              .id,
          )
        : "",
    );

    setInventoryNumber("");
    setSerialNumber("");
    setBrand("");
    setModel("");

    setStatus(
      "DISPONIBLE",
    );

    setTotalQuantity(
      "1",
    );

    setObservations("");
  }, [
    isOpen,
    isEditing,
    equipmentToEdit,
    selectableTypes,
  ]);

  /*
   * Los equipos individuales
   * siempre representan una sola
   * unidad física.
   */
  useEffect(() => {
    if (!selectedType) {
      return;
    }

    if (
      selectedType
        .trackingMode ===
      "INDIVIDUAL"
    ) {
      setTotalQuantity(
        "1",
      );
    }
  }, [
    selectedType,
  ]);

  if (!isOpen) {
    return null;
  }

  const resetForm = () => {
    setTypeId(
      selectableTypes.length >
      0
        ? String(
            selectableTypes[0]
              .id,
          )
        : "",
    );

    setInventoryNumber("");
    setSerialNumber("");
    setBrand("");
    setModel("");

    setStatus(
      "DISPONIBLE",
    );

    setTotalQuantity(
      "1",
    );

    setObservations("");

    setErrors({});
  };

  const handleClose = () => {
    if (isSaving) {
      return;
    }

    resetForm();

    onClose();
  };

  const handleTypeChange =
    (event) => {
      setTypeId(
        event.target.value,
      );

      setErrors(
        (current) => ({
          ...current,

          typeId:
            undefined,

          serialNumber:
            undefined,

          totalQuantity:
            undefined,
        }),
      );
    };

  const validateForm = () => {
    const nextErrors = {};

    if (!typeId) {
      nextErrors.typeId =
        "Seleccioná un tipo de equipamiento";
    }

    /*
     * Para equipamiento individual
     * el número de serie es obligatorio.
     */
    if (
      !isQuantity &&
      !serialNumber.trim()
    ) {
      nextErrors.serialNumber =
        "El número de serie es obligatorio para equipamiento individual";
    }

    /*
     * Para stock por cantidad,
     * debe ser entero mayor a cero.
     */
    if (isQuantity) {
      const quantity =
        Number(
          totalQuantity,
        );

      if (
        !Number.isInteger(
          quantity,
        ) ||
        quantity <= 0
      ) {
        nextErrors.totalQuantity =
          "Ingresá una cantidad entera mayor a cero";
      }
    }

    setErrors(
      nextErrors,
    );

    return (
      Object.keys(
        nextErrors,
      ).length ===
      0
    );
  };

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      if (isSaving) {
        return;
      }

      setErrors({});

      if (
        !validateForm()
      ) {
        return;
      }

      try {
        /*
         * El Equipment guarda solamente
         * la relación con EquipmentType.
         *
         * category y defaultAssignmentType
         * ya pertenecen al tipo y no deben
         * duplicarse dentro del equipo.
         */
        const payload = {
          typeId:
            Number(
              typeId,
            ),

          inventoryNumber,
          serialNumber,

          brand,
          model,
          status,

          totalQuantity:
            isQuantity
              ? Number(
                  totalQuantity,
                )
              : 1,

          observations,
        };

        /*
         * Segundo parámetro:
         * equipo que se está editando.
         *
         * En creación será null.
         */
        await onSave(
          payload,
          equipmentToEdit,
        );

        resetForm();

        onClose();
      } catch (error) {
        const fieldErrors =
          {};

        error.details?.forEach(
          (detail) => {
            if (
              detail.field
            ) {
              fieldErrors[
                detail.field
              ] =
                detail.message;
            }
          },
        );

        if (
          Object.keys(
            fieldErrors,
          ).length > 0
        ) {
          setErrors(
            fieldErrors,
          );

          return;
        }

        setErrors({
          general:
            error.message ||
            (
              isEditing
                ? "No se pudo actualizar el equipamiento"
                : "No se pudo registrar el equipamiento"
            ),
        });
      }
    };

  /*
   * ASIGNADO solamente aparece
   * cuando editamos un elemento
   * que ya está asignado.
   *
   * No puede seleccionarse manualmente
   * al crear equipamiento.
   */
  const showAssignedStatus =
    isEditing &&
    equipmentToEdit?.status ===
      "ASIGNADO";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6 backdrop-blur-[2px]">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* HEADER */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-[#163b65]">
              {isEditing ? (
                <Save
                  size={18}
                />
              ) : (
                <Package
                  size={18}
                />
              )}

              Equipamiento
            </div>

            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
              {isEditing
                ? "Editar equipo"
                : "Nuevo equipo"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {isEditing
                ? "Modificá los datos del elemento registrado."
                : "Registrá un nuevo elemento dentro del inventario."}
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
          noValidate
          className="overflow-y-auto px-6 py-5"
        >
          {errors.general && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {
                errors.general
              }
            </div>
          )}

          {/* TIPO */}
          <div>
            <label
              htmlFor="equipmentType"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Tipo de equipamiento *
            </label>

            <select
              id="equipmentType"
              value={
                typeId
              }
              onChange={
                handleTypeChange
              }
              disabled={
                isSaving ||
                isEditing
              }
              className={`${inputClasses} ${
                errors.typeId
                  ? "border-red-300"
                  : ""
              } disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500`}
            >
              {selectableTypes.length ===
              0 ? (
                <option value="">
                  No hay tipos disponibles
                </option>
              ) : (
                groupedTypes.map(
                  (group) => (
                    <optgroup
                      key={
                        group.value
                      }
                      label={
                        group.label
                      }
                    >
                      {group.types.map(
                        (type) => (
                          <option
                            key={
                              type.id
                            }
                            value={
                              type.id
                            }
                          >
                            {
                              type.name
                            }
                          </option>
                        ),
                      )}
                    </optgroup>
                  ),
                )
              )}
            </select>

            {isEditing && (
              <p className="mt-1.5 text-xs text-slate-400">
                El tipo de equipamiento no se modifica desde la edición del registro.
              </p>
            )}

            {errors.typeId && (
              <p className="mt-1.5 text-xs font-medium text-red-600">
                {
                  errors.typeId
                }
              </p>
            )}
          </div>

          {/* INFORMACIÓN DEL TIPO */}
          {selectedType && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#edf3f8] text-[#163b65]">
                  <Tags
                    size={18}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">
                    {
                      selectedType.name
                    }
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {/* CATEGORÍA */}
                    <span className="rounded-md bg-[#edf3f8] px-2.5 py-1 text-xs font-medium text-[#163b65]">
                      {getCategoryLabel(
                        selectedType.category,
                      )}
                    </span>

                    {/* CONTROL */}
                    <span className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm">
                      {isQuantity
                        ? "Por cantidad"
                        : "Individual"}
                    </span>

                    {/* MODALIDAD */}
                    {selectedType.defaultAssignmentType && (
                      <span
                        className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                          selectedType.defaultAssignmentType ===
                          "PERMANENT"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {getAssignmentTypeLabel(
                          selectedType.defaultAssignmentType,
                        )}
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-xs leading-5 text-slate-500">
                    {isQuantity
                      ? "Este tipo se administra mediante un stock de unidades."
                      : "Cada unidad se identifica individualmente mediante su número de serie."}
                  </p>

                  {selectedType
                    .defaultAssignmentType && (
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {getAssignmentTypeDescription(
                        selectedType.defaultAssignmentType,
                      )}
                    </p>
                  )}
                </div>
              </div>

              {/* REGLA ESPECÍFICA DE ARMAMENTO */}
              {isArmament && (
                <div className="mt-4 border-t border-slate-200 pt-3">
                  <p className="text-xs font-medium text-slate-600">
                    Modalidad logística del armamento
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    La modalidad está definida por el tipo de arma y se aplicará automáticamente al momento de realizar la asignación.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* IDENTIFICACIÓN */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-800">
              Identificación
            </h3>

            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="inventoryNumber"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  N° de inventario
                </label>

                <input
                  id="inventoryNumber"
                  type="text"
                  value={
                    inventoryNumber
                  }
                  onChange={(
                    event,
                  ) =>
                    setInventoryNumber(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Ej. INV-001"
                  className={`${inputClasses} ${
                    errors.inventoryNumber
                      ? "border-red-300"
                      : ""
                  }`}
                />

                {errors.inventoryNumber && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">
                    {
                      errors.inventoryNumber
                    }
                  </p>
                )}
              </div>

              {!isQuantity && (
                <div>
                  <label
                    htmlFor="serialNumber"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    N° de serie *
                  </label>

                  <input
                    id="serialNumber"
                    type="text"
                    value={
                      serialNumber
                    }
                    onChange={(
                      event,
                    ) =>
                      setSerialNumber(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Ej. ABC123456"
                    className={`${inputClasses} ${
                      errors.serialNumber
                        ? "border-red-300"
                        : ""
                    }`}
                  />

                  {errors.serialNumber && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">
                      {
                        errors.serialNumber
                      }
                    </p>
                  )}
                </div>
              )}
            </div>

            {!isQuantity && (
              <p className="mt-2 text-xs text-slate-500">
                El N° de serie identifica de forma única al equipo individual. El N° de inventario es adicional y opcional.
              </p>
            )}
          </div>

          {/* DATOS DEL EQUIPO */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-800">
              Datos del equipo
            </h3>

            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="brand"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Marca
                </label>

                <input
                  id="brand"
                  type="text"
                  value={
                    brand
                  }
                  onChange={(
                    event,
                  ) =>
                    setBrand(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Ej. Bersa"
                  className={`${inputClasses} ${
                    errors.brand
                      ? "border-red-300"
                      : ""
                  }`}
                />

                {errors.brand && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">
                    {
                      errors.brand
                    }
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="model"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Modelo
                </label>

                <input
                  id="model"
                  type="text"
                  value={
                    model
                  }
                  onChange={(
                    event,
                  ) =>
                    setModel(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Ej. TPR9"
                  className={`${inputClasses} ${
                    errors.model
                      ? "border-red-300"
                      : ""
                  }`}
                />

                {errors.model && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">
                    {
                      errors.model
                    }
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* CANTIDAD */}
          {isQuantity && (
            <div className="mt-6">
              <label
                htmlFor="totalQuantity"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Cantidad total *
              </label>

              <input
                id="totalQuantity"
                type="number"
                min="1"
                step="1"
                value={
                  totalQuantity
                }
                onChange={(
                  event,
                ) =>
                  setTotalQuantity(
                    event.target
                      .value,
                  )
                }
                className={`${inputClasses} ${
                  errors.totalQuantity
                    ? "border-red-300"
                    : ""
                }`}
              />

              <p className="mt-1.5 text-xs text-slate-500">
                Ingresá la cantidad sin separadores. Por ejemplo:{" "}
                <strong>
                  1500
                </strong>
                , no 1.500.
              </p>

              {isEditing &&
                equipmentToEdit && (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <p className="text-xs text-slate-500">
                      Stock registrado actualmente
                    </p>

                    <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-xs">
                      <span className="font-medium text-slate-700">
                        Total:{" "}
                        {
                          equipmentToEdit
                            .totalQuantity
                        }
                      </span>

                      <span className="font-medium text-slate-700">
                        Disponibles:{" "}
                        {
                          equipmentToEdit
                            .availableQuantity
                        }
                      </span>
                    </div>
                  </div>
                )}

              {errors.totalQuantity && (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {
                    errors.totalQuantity
                  }
                </p>
              )}
            </div>
          )}

          {/* ESTADO */}
          <div className="mt-6">
            <label
              htmlFor="equipmentStatus"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Estado *
            </label>

            <select
              id="equipmentStatus"
              value={
                status
              }
              onChange={(
                event,
              ) =>
                setStatus(
                  event.target
                    .value,
                )
              }
              disabled={
                isSaving ||
                showAssignedStatus
              }
              className={`${inputClasses} ${
                errors.status
                  ? "border-red-300"
                  : ""
              } disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500`}
            >
              {showAssignedStatus && (
                <option value="ASIGNADO">
                  Asignado
                </option>
              )}

              {EQUIPMENT_STATUSES.map(
                (option) => (
                  <option
                    key={
                      option.value
                    }
                    value={
                      option.value
                    }
                  >
                    {
                      option.label
                    }
                  </option>
                ),
              )}
            </select>

            {showAssignedStatus && (
              <p className="mt-1.5 text-xs text-slate-500">
                El equipo tiene una asignación activa. Su estado se modifica registrando la devolución.
              </p>
            )}

            {errors.status && (
              <p className="mt-1.5 text-xs font-medium text-red-600">
                {
                  errors.status
                }
              </p>
            )}
          </div>

          {/* OBSERVACIONES */}
          <div className="mt-6">
            <label
              htmlFor="equipmentObservations"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Observaciones
            </label>

            <textarea
              id="equipmentObservations"
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
              placeholder="Información adicional..."
              className={`${inputClasses} resize-none ${
                errors.observations
                  ? "border-red-300"
                  : ""
              }`}
            />

            {errors.observations && (
              <p className="mt-1.5 text-xs font-medium text-red-600">
                {
                  errors.observations
                }
              </p>
            )}
          </div>

          {/* ACCIONES */}
          <div className="mt-7 flex justify-end gap-3 border-t border-slate-100 pt-5">
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
                selectableTypes.length ===
                  0
              }
              className="inline-flex items-center gap-2 rounded-xl bg-[#163b65] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#123252] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isEditing ? (
                <Save
                  size={17}
                />
              ) : (
                <Plus
                  size={17}
                />
              )}

              {isSaving
                ? "Guardando..."
                : isEditing
                  ? "Guardar cambios"
                  : "Guardar equipo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EquipmentFormModal;