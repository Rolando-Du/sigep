import {
  useEffect,
  useState,
} from "react";

import {
  Boxes,
  Package,
  Pencil,
  Plus,
  Settings2,
  Tags,
} from "lucide-react";

import EquipmentFormModal from "../components/equipment/EquipmentFormModal";
import EquipmentTypeModal from "../components/equipment/EquipmentTypeModal";

import {
  createEquipment,
  getEquipment,
  updateEquipment,
} from "../services/equipment.service";

import {
  createEquipmentType,
  getEquipmentTypes,
} from "../services/equipmentType.service";

const STATUS_LABELS = {
  DISPONIBLE: "Disponible",
  ASIGNADO: "Asignado",
  EN_CUSTODIA: "En custodia",
  EN_REPARACION: "En reparación",
  FUERA_DE_SERVICIO:
    "Fuera de servicio",
  BAJA: "Baja",
};

const getStatusClasses = (
  status,
) => {
  switch (status) {
    case "DISPONIBLE":
      return "bg-emerald-50 text-emerald-700";

    case "ASIGNADO":
      return "bg-blue-50 text-blue-700";

    case "EN_CUSTODIA":
      return "bg-amber-50 text-amber-700";

    case "EN_REPARACION":
      return "bg-orange-50 text-orange-700";

    case "FUERA_DE_SERVICIO":
      return "bg-red-50 text-red-700";

    case "BAJA":
      return "bg-slate-100 text-slate-500";

    default:
      return "bg-slate-100 text-slate-600";
  }
};

const EquipmentInfoItem = ({
  label,
  children,
}) => {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <div className="mt-2 min-w-0">
        {children}
      </div>
    </div>
  );
};

const Equipment = () => {
  const [
    equipmentTypes,
    setEquipmentTypes,
  ] = useState([]);

  const [
    equipment,
    setEquipment,
  ] = useState([]);

  const [
    isTypesModalOpen,
    setIsTypesModalOpen,
  ] = useState(false);

  const [
    isEquipmentModalOpen,
    setIsEquipmentModalOpen,
  ] = useState(false);

  const [
    equipmentToEdit,
    setEquipmentToEdit,
  ] = useState(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSavingType,
    setIsSavingType,
  ] = useState(false);

  const [
    isSavingEquipment,
    setIsSavingEquipment,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  /*
   * CARGA INICIAL
   */
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const [
          equipmentTypesData,
          equipmentData,
        ] = await Promise.all([
          getEquipmentTypes(),
          getEquipment(),
        ]);

        setEquipmentTypes(
          equipmentTypesData,
        );

        setEquipment(
          equipmentData,
        );
      } catch (error) {
        console.error(
          "Error al cargar equipamiento:",
          error,
        );

        setErrorMessage(
          error.message ||
            "No se pudo cargar el equipamiento",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  /*
   * CREAR TIPO
   */
  const handleCreateEquipmentType =
    async (
      equipmentTypeData,
    ) => {
      try {
        setIsSavingType(true);

        const createdType =
          await createEquipmentType(
            equipmentTypeData,
          );

        setEquipmentTypes(
          (currentTypes) =>
            [
              ...currentTypes,
              createdType,
            ].sort((a, b) =>
              a.name.localeCompare(
                b.name,
                "es",
                {
                  sensitivity:
                    "base",
                },
              ),
            ),
        );

        return createdType;
      } finally {
        setIsSavingType(false);
      }
    };

  /*
   * ABRIR MODAL NUEVO EQUIPO
   */
  const handleOpenCreateEquipment =
    () => {
      setEquipmentToEdit(
        null,
      );

      setIsEquipmentModalOpen(
        true,
      );
    };

  /*
   * ABRIR MODAL EDICIÓN
   */
  const handleOpenEditEquipment =
    (item) => {
      if (
        !item ||
        isSavingEquipment
      ) {
        return;
      }

      setEquipmentToEdit(
        item,
      );

      setIsEquipmentModalOpen(
        true,
      );
    };

  /*
   * CERRAR MODAL
   */
  const handleCloseEquipmentModal =
    () => {
      if (isSavingEquipment) {
        return;
      }

      setIsEquipmentModalOpen(
        false,
      );

      setEquipmentToEdit(
        null,
      );
    };

  /*
   * GUARDAR EQUIPAMIENTO
   *
   * El mismo modal sirve para:
   *
   * - Crear
   * - Editar
   */
  const handleSaveEquipment =
    async (
      equipmentData,
      currentEquipment,
    ) => {
      try {
        setIsSavingEquipment(
          true,
        );

        setErrorMessage("");

        /*
         * EDICIÓN
         */
        if (
          currentEquipment?.id
        ) {
          const updatedEquipment =
            await updateEquipment(
              currentEquipment.id,
              equipmentData,
            );

          setEquipment(
            (
              currentEquipmentList,
            ) =>
              currentEquipmentList.map(
                (item) =>
                  item.id ===
                  updatedEquipment.id
                    ? updatedEquipment
                    : item,
              ),
          );

          return updatedEquipment;
        }

        /*
         * CREACIÓN
         */
        const createdEquipment =
          await createEquipment(
            equipmentData,
          );

        setEquipment(
          (
            currentEquipmentList,
          ) => [
            createdEquipment,
            ...currentEquipmentList,
          ],
        );

        return createdEquipment;
      } finally {
        setIsSavingEquipment(
          false,
        );
      }
    };

  const activeTypes =
    equipmentTypes.filter(
      (type) =>
        type.isActive,
    );

  const availableCount =
    equipment.reduce(
      (
        total,
        item,
      ) =>
        total +
        (item.availableQuantity ||
          0),
      0,
    );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* ENCABEZADO */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-[#163b65]">
            <Package
              size={18}
            />

            Gestión de equipamiento
          </div>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            Equipamiento
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Registro y administración
            del equipamiento de SIGEP.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() =>
              setIsTypesModalOpen(
                true,
              )
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <Settings2
              size={18}
            />

            Administrar tipos
          </button>

          <button
            type="button"
            onClick={
              handleOpenCreateEquipment
            }
            disabled={
              isLoading ||
              activeTypes.length ===
                0
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#163b65] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#123252] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={18} />

            Nuevo equipo
          </button>
        </div>
      </div>

      {/* ERROR */}
      {errorMessage && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {/* RESUMEN */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Registros
          </p>

          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {isLoading
              ? "..."
              : equipment.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Unidades disponibles
          </p>

          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {isLoading
              ? "..."
              : availableCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Tipos activos
          </p>

          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {isLoading
              ? "..."
              : activeTypes.length}
          </p>
        </div>
      </div>

      {/* TIPOS */}
      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Tags
                size={18}
                className="shrink-0 text-[#163b65]"
              />

              <p className="text-sm font-semibold text-slate-800">
                Tipos de equipamiento
              </p>
            </div>

            <p className="mt-1 text-xs text-slate-500">
              Catálogo utilizado para
              clasificar los elementos.
            </p>
          </div>

          <span className="shrink-0 rounded-full bg-[#edf3f8] px-3 py-1.5 text-xs font-semibold text-[#163b65]">
            {isLoading
              ? "..."
              : activeTypes.length}
          </span>
        </div>

        {!isLoading &&
          activeTypes.length >
            0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {activeTypes.map(
                (type) => (
                  <span
                    key={
                      type.id
                    }
                    className="inline-flex max-w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                  >
                    {type.trackingMode ===
                    "QUANTITY" ? (
                      <Boxes
                        size={14}
                        className="shrink-0"
                      />
                    ) : (
                      <Package
                        size={14}
                        className="shrink-0"
                      />
                    )}

                    <span className="wrap-break-word">
                      {type.name}
                    </span>
                  </span>
                ),
              )}
            </div>
          )}
      </section>

      {/* LISTADO */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <p className="text-sm font-semibold text-slate-800">
            Equipamiento registrado
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {isLoading
              ? "Cargando..."
              : `${equipment.length} ${
                  equipment.length ===
                  1
                    ? "registro"
                    : "registros"
                }`}
          </p>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-sm text-slate-500">
            Cargando equipamiento...
          </div>
        ) : equipment.length ===
          0 ? (
          <div className="py-16 text-center">
            <Package
              size={36}
              className="mx-auto text-slate-300"
            />

            <p className="mt-4 text-sm font-medium text-slate-700">
              No hay equipamiento
              registrado
            </p>

            <p className="mx-auto mt-1 max-w-md px-4 text-xs leading-5 text-slate-500">
              Utilizá el botón Nuevo
              equipo para registrar el
              primer elemento.
            </p>
          </div>
        ) : (
          <div className="space-y-3 bg-slate-50/50 p-3 sm:p-4">
            {equipment.map(
              (item) => {
                const isQuantity =
                  item.type
                    ?.trackingMode ===
                  "QUANTITY";

                return (
                  <article
                    key={item.id}
                    onClick={() =>
                      handleOpenEditEquipment(
                        item,
                      )
                    }
                    className="min-w-0 cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-[#7394b2]/60 hover:shadow-md"
                    title="Clic para editar"
                  >
                    {/* ENCABEZADO DEL EQUIPO */}
                    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#edf3f8] text-[#163b65]">
                          {isQuantity ? (
                            <Boxes
                              size={19}
                            />
                          ) : (
                            <Package
                              size={19}
                            />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="wrap-break-word text-base font-semibold text-slate-900">
                            {item.type
                              ?.name ||
                              "Sin tipo"}
                          </p>

                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span className="text-xs text-slate-500">
                              {isQuantity
                                ? "Por cantidad"
                                : "Individual"}
                            </span>

                            <span className="text-slate-300">
                              ·
                            </span>

                            <span className="wrap-break-word text-xs text-slate-500">
                              {[
                                item.brand,
                                item.model,
                              ]
                                .filter(
                                  Boolean,
                                )
                                .join(
                                  " · ",
                                ) ||
                                "Sin marca / modelo"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(
                          event,
                        ) => {
                          event.stopPropagation();

                          handleOpenEditEquipment(
                            item,
                          );
                        }}
                        className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-600 transition hover:border-[#7394b2] hover:bg-[#edf3f8] hover:text-[#163b65]"
                      >
                        <Pencil
                          size={14}
                        />

                        Editar
                      </button>
                    </div>

                    {/* INFORMACIÓN */}
                    <div className="grid grid-cols-1 gap-3 border-t border-slate-100 p-4 sm:grid-cols-2 xl:grid-cols-3">
                      {/* IDENTIFICACIÓN */}
                      <EquipmentInfoItem label="Identificación">
                        {item.serialNumber ? (
                          <p className="break-all text-sm font-medium text-slate-700">
                            Serie:{" "}
                            {
                              item.serialNumber
                            }
                          </p>
                        ) : (
                          <p className="text-sm text-slate-400">
                            Sin número de serie
                          </p>
                        )}

                        {item.inventoryNumber && (
                          <p className="mt-1 break-all text-xs text-slate-500">
                            Inventario:{" "}
                            {
                              item.inventoryNumber
                            }
                          </p>
                        )}
                      </EquipmentInfoItem>

                      {/* CANTIDAD */}
                      <EquipmentInfoItem
                        label={
                          isQuantity
                            ? "Stock"
                            : "Cantidad"
                        }
                      >
                        {isQuantity ? (
                          <>
                            <p className="text-sm font-semibold text-slate-800">
                              {
                                item.availableQuantity
                              }{" "}
                              disponibles
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              Total:{" "}
                              {
                                item.totalQuantity
                              }
                            </p>
                          </>
                        ) : (
                          <p className="text-sm font-medium text-slate-700">
                            1 unidad
                          </p>
                        )}
                      </EquipmentInfoItem>

                      {/* ESTADO */}
                      <EquipmentInfoItem label="Estado">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                            item.status,
                          )}`}
                        >
                          {STATUS_LABELS[
                            item.status
                          ] ||
                            item.status}
                        </span>
                      </EquipmentInfoItem>
                    </div>

                    {/* OBSERVACIONES */}
                    {item.observations && (
                      <div className="border-t border-slate-100 px-5 py-4">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          Observaciones
                        </p>

                        <p className="mt-1.5 wrap-break-word text-xs leading-5 text-slate-500">
                          {
                            item.observations
                          }
                        </p>
                      </div>
                    )}
                  </article>
                );
              },
            )}
          </div>
        )}
      </section>

      {/* MODAL TIPOS */}
      <EquipmentTypeModal
        isOpen={
          isTypesModalOpen
        }
        onClose={() =>
          setIsTypesModalOpen(
            false,
          )
        }
        equipmentTypes={
          equipmentTypes
        }
        onCreate={
          handleCreateEquipmentType
        }
        isSaving={
          isSavingType
        }
      />

      {/* MODAL CREAR / EDITAR EQUIPO */}
      <EquipmentFormModal
        isOpen={
          isEquipmentModalOpen
        }
        onClose={
          handleCloseEquipmentModal
        }
        equipmentTypes={
          equipmentTypes
        }
        onSave={
          handleSaveEquipment
        }
        isSaving={
          isSavingEquipment
        }
        equipmentToEdit={
          equipmentToEdit
        }
      />
    </div>
  );
};

export default Equipment;