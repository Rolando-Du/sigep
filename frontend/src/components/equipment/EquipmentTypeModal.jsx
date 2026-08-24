import { useState } from "react";
import {
  Boxes,
  Package,
  Plus,
  Tags,
  X,
} from "lucide-react";

const inputClasses =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#7394b2] focus:ring-4 focus:ring-[#163b65]/5";

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
    label: "Otro",
  },
];

const getCategoryLabel = (category) =>
  EQUIPMENT_CATEGORIES.find(
    (item) => item.value === category,
  )?.label || "Otro";

const getTrackingModeLabel = (mode) =>
  mode === "QUANTITY"
    ? "Por cantidad"
    : "Individual";

const getAssignmentTypeLabel = (type) => {
  if (type === "PERMANENT") {
    return "Permanente";
  }

  if (type === "TEMPORARY") {
    return "Temporaria";
  }

  return "Sin modalidad";
};

const normalizeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const isPistolTypeName = (value) =>
  normalizeText(value).includes("pistola");

const isBallisticVestTypeName = (value) => {
  const normalized = normalizeText(value);

  return (
    normalized.includes("chaleco") &&
    normalized.includes("bal")
  );
};

const getControlledAssignmentType = (
  typeName,
) => {
  if (isPistolTypeName(typeName)) {
    return "PERMANENT";
  }

  if (isBallisticVestTypeName(typeName)) {
    return "TEMPORARY";
  }

  return null;
};

const EquipmentTypeModal = ({
  isOpen,
  onClose,
  equipmentTypes = [],
  onCreate,
  isSaving = false,
}) => {
  const [name, setName] = useState("");
  const [category, setCategory] =
    useState("OTRO");
  const [trackingMode, setTrackingMode] =
    useState("INDIVIDUAL");
  const [description, setDescription] =
    useState("");
  const [errors, setErrors] = useState({});

  if (!isOpen) {
    return null;
  }

  // FORMULARIO
  const resetForm = () => {
    setName("");
    setCategory("OTRO");
    setTrackingMode("INDIVIDUAL");
    setDescription("");
    setErrors({});
  };

  const handleClose = () => {
    if (isSaving) {
      return;
    }

    resetForm();
    onClose();
  };

  // CATEGORÍA
  const handleCategoryChange = (event) => {
    const nextCategory = event.target.value;

    setCategory(nextCategory);

    setErrors((current) => ({
      ...current,
      category: undefined,
      trackingMode: undefined,
    }));

    if (nextCategory === "ARMAMENTO") {
      setTrackingMode("INDIVIDUAL");
      return;
    }

    if (nextCategory === "MUNICION") {
      setTrackingMode("QUANTITY");
    }
  };

  // MODO DE CONTROL
  const handleTrackingModeChange = (
    nextMode,
  ) => {
    if (
      category === "ARMAMENTO" &&
      nextMode !== "INDIVIDUAL"
    ) {
      return;
    }

    if (
      category === "MUNICION" &&
      nextMode !== "QUANTITY"
    ) {
      return;
    }

    setTrackingMode(nextMode);

    setErrors((current) => ({
      ...current,
      trackingMode: undefined,
    }));
  };

  const controlledAssignmentType =
    getControlledAssignmentType(name);

  // GUARDAR
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    const localErrors = {};

    if (!name.trim()) {
      localErrors.name =
        "Ingresá el nombre del tipo de equipamiento";
    }

    if (
      Object.keys(localErrors).length > 0
    ) {
      setErrors(localErrors);
      return;
    }

    setErrors({});

    try {
      await onCreate({
        name: name.trim(),
        category,
        trackingMode,
        defaultAssignmentType:
          controlledAssignmentType,
        description: description.trim(),
      });

      resetForm();
    } catch (error) {
      const fieldErrors = {};

      error.details?.forEach((detail) => {
        if (detail.field) {
          fieldErrors[detail.field] =
            detail.message;
        }
      });

      if (
        Object.keys(fieldErrors).length > 0
      ) {
        setErrors(fieldErrors);
        return;
      }

      setErrors({
        general:
          error.message ||
          "No se pudo crear el tipo de equipamiento",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6 backdrop-blur-[2px]">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* HEADER */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-[#163b65]">
              <Tags size={18} />
              Catálogo
            </div>

            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
              Tipos de equipamiento
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Administrá los tipos disponibles
              para registrar equipamiento.
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

        <div className="overflow-y-auto">
          {/* TIPOS REGISTRADOS */}
          <div className="px-6 py-5">
            <h3 className="text-sm font-semibold text-slate-800">
              Tipos registrados
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              {equipmentTypes.length}{" "}
              {equipmentTypes.length === 1
                ? "tipo registrado"
                : "tipos registrados"}
            </p>

            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
              {equipmentTypes.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {equipmentTypes.map((type) => (
                    <div
                      key={type.id}
                      className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800">
                          {type.name}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-[#edf3f8] px-2 py-1 text-[11px] font-medium text-[#163b65]">
                            {getCategoryLabel(
                              type.category,
                            )}
                          </span>

                          <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                            {getTrackingModeLabel(
                              type.trackingMode,
                            )}
                          </span>

                          {type.defaultAssignmentType && (
                            <span
                              className={`rounded-md px-2 py-1 text-[11px] font-medium ${
                                type.defaultAssignmentType ===
                                "PERMANENT"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {getAssignmentTypeLabel(
                                type.defaultAssignmentType,
                              )}
                            </span>
                          )}
                        </div>

                        {type.description && (
                          <p className="mt-2 text-xs text-slate-500">
                            {type.description}
                          </p>
                        )}
                      </div>

                      <span
                        className={`shrink-0 self-start rounded-full px-2.5 py-1 text-xs font-medium sm:self-auto ${
                          type.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {type.isActive
                          ? "Activo"
                          : "Inactivo"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-8 text-center">
                  <Tags
                    size={26}
                    className="mx-auto text-slate-300"
                  />

                  <p className="mt-2 text-sm text-slate-500">
                    Todavía no hay tipos
                    registrados.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* NUEVO TIPO */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-slate-100 bg-slate-50 px-6 py-5"
            noValidate
          >
            <div className="flex items-center gap-2">
              <Plus
                size={18}
                className="text-[#163b65]"
              />

              <h3 className="text-sm font-semibold text-slate-800">
                Agregar tipo
              </h3>
            </div>

            {errors.general && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errors.general}
              </div>
            )}

            {/* NOMBRE */}
            <div className="mt-4">
              <label
                htmlFor="equipmentTypeName"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Tipo de equipamiento *
              </label>

              <input
                id="equipmentTypeName"
                type="text"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);

                  setErrors((current) => ({
                    ...current,
                    name: undefined,
                  }));
                }}
                placeholder="Ej. Pistola, Escopeta, Chaleco Balístico..."
                className={`${inputClasses} ${
                  errors.name
                    ? "border-red-300"
                    : ""
                }`}
              />

              {errors.name && (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {errors.name}
                </p>
              )}

              <p className="mt-1.5 text-xs text-slate-400">
                Ingresá el tipo específico, no
                la categoría general.
              </p>
            </div>

            {/* CATEGORÍA */}
            <div className="mt-5">
              <label
                htmlFor="equipmentTypeCategory"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Categoría *
              </label>

              <select
                id="equipmentTypeCategory"
                value={category}
                onChange={
                  handleCategoryChange
                }
                className={`${inputClasses} ${
                  errors.category
                    ? "border-red-300"
                    : ""
                }`}
              >
                {EQUIPMENT_CATEGORIES.map(
                  (item) => (
                    <option
                      key={item.value}
                      value={item.value}
                    >
                      {item.label}
                    </option>
                  ),
                )}
              </select>

              {errors.category && (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {errors.category}
                </p>
              )}

              {category === "MUNICION" && (
                <div className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-xs font-medium text-slate-700">
                    La munición se administra
                    como stock por cantidad.
                  </p>
                </div>
              )}

              {category === "ARMAMENTO" &&
                !isPistolTypeName(name) && (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-xs font-medium text-slate-700">
                      Solo Pistola se asigna al personal.
                      El resto del armamento queda como stock general.
                    </p>
                  </div>
                )}
            </div>

            {/* MODO DE CONTROL */}
            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Modo de control *
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={
                    category === "MUNICION"
                  }
                  onClick={() =>
                    handleTrackingModeChange(
                      "INDIVIDUAL",
                    )
                  }
                  className={`rounded-xl border p-4 text-left transition ${
                    trackingMode ===
                    "INDIVIDUAL"
                      ? "border-[#163b65] bg-[#edf3f8] ring-2 ring-[#163b65]/10"
                      : category ===
                          "MUNICION"
                        ? "cursor-not-allowed border-slate-100 bg-slate-100 opacity-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        trackingMode ===
                        "INDIVIDUAL"
                          ? "bg-[#163b65] text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Package size={18} />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Individual
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Cada unidad se controla
                        individualmente.
                      </p>

                      <p className="mt-2 text-[11px] text-slate-400">
                        Ej. Pistola, escopeta,
                        chaleco
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  disabled={
                    category === "ARMAMENTO"
                  }
                  onClick={() =>
                    handleTrackingModeChange(
                      "QUANTITY",
                    )
                  }
                  className={`rounded-xl border p-4 text-left transition ${
                    trackingMode === "QUANTITY"
                      ? "border-[#163b65] bg-[#edf3f8] ring-2 ring-[#163b65]/10"
                      : category ===
                          "ARMAMENTO"
                        ? "cursor-not-allowed border-slate-100 bg-slate-100 opacity-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        trackingMode ===
                        "QUANTITY"
                          ? "bg-[#163b65] text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Boxes size={18} />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Por cantidad
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Se controla stock total y
                        cantidad disponible.
                      </p>

                      <p className="mt-2 text-[11px] text-slate-400">
                        Ej. Cargadores,
                        municiones
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              {errors.trackingMode && (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {errors.trackingMode}
                </p>
              )}
            </div>

            {/* MODALIDAD */}
            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Modalidad de asignación
              </label>

              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-sm font-semibold text-slate-800">
                  {controlledAssignmentType
                    ? getAssignmentTypeLabel(
                        controlledAssignmentType,
                      )
                    : "Sin modalidad"}
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {controlledAssignmentType ===
                  "PERMANENT"
                    ? "Pistola se asigna de forma Permanente."
                    : controlledAssignmentType ===
                        "TEMPORARY"
                      ? "Chaleco Balístico se asigna de forma Temporaria para identificar qué chaleco corresponde a cada oficial."
                      : "Este tipo se administra como stock general y no se asigna directamente al personal."}
                </p>
              </div>
            </div>

            {/* DESCRIPCIÓN */}
            <div className="mt-5">
              <label
                htmlFor="equipmentTypeDescription"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Descripción
              </label>

              <textarea
                id="equipmentTypeDescription"
                rows={3}
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value,
                  )
                }
                placeholder="Descripción opcional..."
                className={`${inputClasses} resize-none ${
                  errors.description
                    ? "border-red-300"
                    : ""
                }`}
              />

              {errors.description && (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {errors.description}
                </p>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-[#163b65] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#123252] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus size={17} />

                {isSaving
                  ? "Guardando..."
                  : "Agregar tipo"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EquipmentTypeModal;