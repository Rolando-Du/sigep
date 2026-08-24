import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ChevronLeft,
  ChevronRight,
  History,
  Package,
  Search,
  X,
} from "lucide-react";

const PAGE_SIZE = 10;

const getPersonName = (person) => {
  if (!person) {
    return "";
  }

  if (person.name) {
    return person.name;
  }

  return [
    person.firstName,
    person.lastName,
  ]
    .filter(Boolean)
    .join(" ");
};

const getAssignmentTypeLabel = (
  type,
) => {
  if (type === "PERMANENT") {
    return "Permanente";
  }

  if (type === "TEMPORARY") {
    return "Temporaria";
  }

  return type || "Sin especificar";
};

const getAssignmentStatusLabel = (
  status,
) => {
  if (status === "ACTIVE") {
    return "Activa";
  }

  if (status === "RETURNED") {
    return "Devuelta";
  }

  if (status === "CANCELLED") {
    return "Cancelada";
  }

  return status || "Sin estado";
};

const getAssignmentStatusClasses = (
  status,
) => {
  if (status === "ACTIVE") {
    return "bg-blue-50 text-blue-700";
  }

  if (status === "RETURNED") {
    return "bg-emerald-50 text-emerald-700";
  }

  return "bg-slate-100 text-slate-600";
};

const getLogisticSituationLabel = (
  type,
  status,
) => {
  if (
    status === "RETURNED"
  ) {
    return "Devuelto";
  }

  if (
    status === "CANCELLED"
  ) {
    return "Sin asignación";
  }

  if (
    type === "PERMANENT"
  ) {
    return "En poder del oficial";
  }

  if (
    type === "TEMPORARY"
  ) {
    return "Sala de Armas";
  }

  return "Sin especificar";
};

const getLogisticSituationClasses = (
  type,
  status,
) => {
  if (
    status === "RETURNED" ||
    status === "CANCELLED"
  ) {
    return "bg-slate-100 text-slate-600";
  }

  if (
    type === "PERMANENT"
  ) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (
    type === "TEMPORARY"
  ) {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-slate-100 text-slate-600";
};

const getEquipmentName = (
  equipment,
) => {
  const typeName =
    equipment?.type?.name ||
    "Equipamiento";

  const brandModel = [
    equipment?.brand,
    equipment?.model,
  ]
    .filter(Boolean)
    .join(" ");

  return brandModel
    ? `${typeName} ${brandModel}`
    : typeName;
};

const getEquipmentIdentification = (
  equipment,
) => {
  if (
    equipment?.serialNumber
  ) {
    return `Serie ${equipment.serialNumber}`;
  }

  if (
    equipment?.inventoryNumber
  ) {
    return `Inventario ${equipment.inventoryNumber}`;
  }

  return "Sin identificación";
};

const formatDateTime = (
  value,
) => {
  if (!value) {
    return "Sin registrar";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Sin registrar";
  }

  return new Intl.DateTimeFormat(
    "es-AR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
};

const PersonnelEquipmentHistoryModal = ({
  isOpen,
  onClose,
  person,
  history = [],
}) => {
  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("ALL");

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSearchTerm("");
    setStatusFilter(
      "ALL",
    );
    setCurrentPage(1);
  }, [
    isOpen,
    person?.id,
  ]);

  /*
   * HISTORIAL FILTRADO
   */
  const filteredHistory =
    useMemo(() => {
      const normalizedSearch =
        searchTerm
          .trim()
          .toLowerCase();

      return [...history]
        .sort(
          (a, b) =>
            new Date(
              b.assignedAt,
            ) -
            new Date(
              a.assignedAt,
            ),
        )
        .filter((item) => {
          if (
            statusFilter !==
              "ALL" &&
            item.assignmentStatus !==
              statusFilter
          ) {
            return false;
          }

          if (!normalizedSearch) {
            return true;
          }

          const equipment =
            item.equipment || {};

          const haystack = [
            equipment.type?.name,
            equipment.brand,
            equipment.model,
            equipment.serialNumber,
            equipment.inventoryNumber,

            getAssignmentTypeLabel(
              item.assignmentType,
            ),

            getLogisticSituationLabel(
              item.assignmentType,
              item.assignmentStatus,
            ),

            item.observations,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return haystack.includes(
            normalizedSearch,
          );
        });
    }, [
      history,
      searchTerm,
      statusFilter,
    ]);

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredHistory.length /
          PAGE_SIZE,
      ),
    );

  useEffect(() => {
    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(
        totalPages,
      );
    }
  }, [
    currentPage,
    totalPages,
  ]);

  const paginatedHistory =
    useMemo(() => {
      const start =
        (currentPage - 1) *
        PAGE_SIZE;

      return filteredHistory.slice(
        start,
        start + PAGE_SIZE,
      );
    }, [
      filteredHistory,
      currentPage,
    ]);

  if (!isOpen) {
    return null;
  }

  const firstRecord =
    filteredHistory.length ===
    0
      ? 0
      : (currentPage - 1) *
          PAGE_SIZE +
        1;

  const lastRecord =
    Math.min(
      currentPage *
        PAGE_SIZE,
      filteredHistory.length,
    );

  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center bg-slate-900/40 px-4 py-6 backdrop-blur-[2px]">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* HEADER */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf3f8] text-[#163b65]">
              <History
                size={20}
                strokeWidth={1.8}
              />
            </div>

            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                Historial de equipamiento
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {getPersonName(
                  person,
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* FILTROS */}
        <div className="border-b border-slate-100 px-6 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {[
                [
                  "ALL",
                  "Todos",
                ],
                [
                  "ACTIVE",
                  "Activos",
                ],
                [
                  "RETURNED",
                  "Devueltos",
                ],
                [
                  "CANCELLED",
                  "Cancelados",
                ],
              ].map(
                ([
                  value,
                  label,
                ]) => (
                  <button
                    key={
                      value
                    }
                    type="button"
                    onClick={() => {
                      setStatusFilter(
                        value,
                      );

                      setCurrentPage(
                        1,
                      );
                    }}
                    className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                      statusFilter ===
                      value
                        ? "bg-[#163b65] text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {label}
                  </button>
                ),
              )}
            </div>

            <div className="relative w-full lg:max-w-sm">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={
                  searchTerm
                }
                onChange={(
                  event,
                ) => {
                  setSearchTerm(
                    event.target
                      .value,
                  );

                  setCurrentPage(
                    1,
                  );
                }}
                placeholder="Buscar equipo, serie, inventario o situación..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-[#7394b2] focus:ring-4 focus:ring-[#163b65]/5"
              />
            </div>
          </div>
        </div>

        {/* CONTENIDO */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {paginatedHistory.length ===
          0 ? (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-6 text-center">
              <p className="text-sm font-medium text-slate-700">
                No hay registros para mostrar
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Probá cambiando los filtros o la búsqueda.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedHistory.map(
                (item) => {
                  const equipment =
                    item.equipment ||
                    {};

                  const isIndividual =
                    equipment.type
                      ?.trackingMode ===
                    "INDIVIDUAL";

                  const pendingQuantity =
                    Math.max(
                      0,
                      (item.quantity ||
                        0) -
                        (item.returnedQuantity ||
                          0),
                    );

                  const situationLabel =
                    getLogisticSituationLabel(
                      item.assignmentType,
                      item.assignmentStatus,
                    );

                  const situationClasses =
                    getLogisticSituationClasses(
                      item.assignmentType,
                      item.assignmentStatus,
                    );

                  return (
                    <div
                      key={`${item.assignmentId}-${item.detailId}`}
                      className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#163b65] shadow-sm">
                            <Package
                              size={
                                18
                              }
                              strokeWidth={
                                1.8
                              }
                            />
                          </div>

                          <div className="min-w-0">
                            <p className="wrap-break-word text-sm font-semibold text-slate-900">
                              {getEquipmentName(
                                equipment,
                              )}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {isIndividual
                                ? getEquipmentIdentification(
                                    equipment,
                                  )
                                : `Cantidad asignada: ${item.quantity}`}
                            </p>

                            {equipment.inventoryNumber &&
                              equipment.serialNumber && (
                                <p className="mt-1 text-xs text-slate-500">
                                  Inventario:{" "}
                                  {
                                    equipment.inventoryNumber
                                  }
                                </p>
                              )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <span className="rounded-full bg-[#edf3f8] px-2.5 py-1 text-xs font-medium text-[#163b65]">
                            {getAssignmentTypeLabel(
                              item.assignmentType,
                            )}
                          </span>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${getAssignmentStatusClasses(
                              item.assignmentStatus,
                            )}`}
                          >
                            {getAssignmentStatusLabel(
                              item.assignmentStatus,
                            )}
                          </span>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${situationClasses}`}
                          >
                            {
                              situationLabel
                            }
                          </span>
                        </div>
                      </div>

                      {/* FECHAS */}
                      <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-200/70 pt-3 text-xs sm:grid-cols-2">
                        <div>
                          <p className="font-medium text-slate-400">
                            Fecha de asignación
                          </p>

                          <p className="mt-1 font-medium text-slate-700">
                            {formatDateTime(
                              item.assignedAt,
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="font-medium text-slate-400">
                            Fecha de devolución
                          </p>

                          <p className="mt-1 font-medium text-slate-700">
                            {item.returnedAt
                              ? formatDateTime(
                                  item.returnedAt,
                                )
                              : item.assignmentStatus ===
                                  "ACTIVE"
                                ? "Asignación activa"
                                : "Sin registrar"}
                          </p>
                        </div>
                      </div>

                      {/* STOCK POR CANTIDAD */}
                      {!isIndividual && (
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-lg bg-white px-2.5 py-1.5 text-slate-600">
                            Asignado:{" "}
                            {
                              item.quantity
                            }
                          </span>

                          <span className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-emerald-700">
                            Devuelto:{" "}
                            {
                              item.returnedQuantity
                            }
                          </span>

                          {pendingQuantity >
                            0 && (
                            <span className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-amber-700">
                              Actualmente
                              asignado:{" "}
                              {
                                pendingQuantity
                              }
                            </span>
                          )}
                        </div>
                      )}

                      {/* OBSERVACIONES */}
                      {item.observations && (
                        <div className="mt-3 border-t border-slate-200/70 pt-3">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Observaciones
                          </p>

                          <p className="mt-1.5 whitespace-pre-wrap text-xs leading-relaxed text-slate-500">
                            {
                              item.observations
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  );
                },
              )}
            </div>
          )}
        </div>

        {/* PAGINACIÓN */}
        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            {filteredHistory.length ===
            0
              ? "0 registros"
              : `Mostrando ${firstRecord}-${lastRecord} de ${filteredHistory.length} registros`}
          </p>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() =>
                setCurrentPage(
                  (current) =>
                    Math.max(
                      1,
                      current - 1,
                    ),
                )
              }
              disabled={
                currentPage ===
                1
              }
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Página anterior"
            >
              <ChevronLeft
                size={17}
              />
            </button>

            <span className="min-w-24 text-center text-xs font-medium text-slate-600">
              Página{" "}
              {currentPage} de{" "}
              {totalPages}
            </span>

            <button
              type="button"
              onClick={() =>
                setCurrentPage(
                  (current) =>
                    Math.min(
                      totalPages,
                      current + 1,
                    ),
                )
              }
              disabled={
                currentPage ===
                totalPages
              }
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Página siguiente"
            >
              <ChevronRight
                size={17}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonnelEquipmentHistoryModal;