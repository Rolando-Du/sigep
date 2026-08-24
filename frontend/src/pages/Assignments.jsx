import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Package,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  getAssignments,
} from "../services/assignment.service";

const PAGE_SIZE = 10;

/*
 * PERSONAL
 */
const getPersonName = (person) => {
  if (!person) {
    return "Sin personal";
  }

  return [
    person.firstName,
    person.lastName,
  ]
    .filter(Boolean)
    .join(" ");
};

/*
 * TIPO DE ASIGNACIÓN
 */
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

/*
 * ESTADO DE LA ASIGNACIÓN
 */
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

const getStatusClasses = (
  status,
) => {
  if (status === "ACTIVE") {
    return "bg-blue-50 text-blue-700";
  }

  if (status === "RETURNED") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "CANCELLED") {
    return "bg-slate-100 text-slate-600";
  }

  return "bg-slate-100 text-slate-600";
};

/*
 * FECHAS
 */
const formatDate = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "es-AR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    },
  ).format(date);
};

/*
 * EQUIPAMIENTO
 */
const getEquipmentName = (
  equipment,
) => {
  if (!equipment) {
    return "Equipamiento";
  }

  const typeName =
    equipment.type?.name ||
    "Equipamiento";

  const brandModel = [
    equipment.brand,
    equipment.model,
  ]
    .filter(Boolean)
    .join(" ");

  return brandModel
    ? `${typeName} ${brandModel}`
    : typeName;
};

const isWeaponEquipment = (
  equipment,
) => {
  const typeName =
    equipment?.type?.name
      ?.trim()
      .toLowerCase() || "";

  return (
    typeName.includes(
      "pistola",
    ) ||
    typeName.includes(
      "armamento",
    )
  );
};

/*
 * SITUACIÓN LOGÍSTICA
 * PARA STOCK POR CANTIDAD
 *
 * No existe una situación física
 * almacenada en la base.
 *
 * Se deduce directamente del
 * tipo de asignación.
 */
const getRemainingLabel = ({
  assignment,
  quantity,
}) => {
  if (
    assignment.status !==
      "ACTIVE" ||
    quantity <= 0
  ) {
    return null;
  }

  /*
   * PERMANENTE
   *
   * El equipamiento se encuentra
   * en poder del oficial.
   */
  if (
    assignment.type ===
    "PERMANENT"
  ) {
    return {
      label:
        "En poder",
      value:
        quantity,
      classes:
        "bg-emerald-50 text-emerald-700",
    };
  }

  /*
   * TEMPORARIA
   *
   * El equipamiento sigue asignado
   * al oficial, pero su resguardo
   * habitual es Sala de Armas.
   */
  if (
    assignment.type ===
    "TEMPORARY"
  ) {
    return {
      label:
        "Sala de Armas",
      value:
        quantity,
      classes:
        "bg-amber-50 text-amber-700",
    };
  }

  return null;
};

/*
 * DETALLE INDIVIDUAL
 */
const IndividualDetail = ({
  detail,
  compact = false,
}) => {
  const equipment =
    detail.equipment;

  const returned =
    detail.returnedQuantity ||
    0;

  const isReturned =
    returned >=
    (detail.quantity || 1);

  return (
    <div
      className={
        compact
          ? "min-w-0 rounded-xl border border-slate-200 bg-white p-3"
          : "min-w-0"
      }
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#edf3f8] text-[#163b65]">
          <Package
            size={14}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="wrap-break-word text-sm font-semibold text-slate-800">
            {getEquipmentName(
              equipment,
            )}
          </p>

          {equipment
            ?.serialNumber ? (
            <p className="mt-1 break-all text-xs text-slate-400">
              Serie{" "}
              {
                equipment.serialNumber
              }
            </p>
          ) : equipment
              ?.inventoryNumber ? (
            <p className="mt-1 break-all text-xs text-slate-400">
              Inventario{" "}
              {
                equipment.inventoryNumber
              }
            </p>
          ) : (
            <p className="mt-1 text-xs text-slate-400">
              Sin identificación
            </p>
          )}

          {isReturned && (
            <span className="mt-2 inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
              Devuelto
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/*
 * DETALLE POR CANTIDAD
 */
const QuantityDetail = ({
  detail,
  assignment,
  compact = false,
}) => {
  const equipment =
    detail.equipment;

  const assigned =
    detail.quantity || 0;

  const returned =
    detail.returnedQuantity ||
    0;

  const remaining = Math.max(
    0,
    assigned - returned,
  );

  const remainingState =
    getRemainingLabel({
      assignment,
      quantity:
        remaining,
    });

  return (
    <div
      className={
        compact
          ? "min-w-0 rounded-xl border border-slate-200 bg-white p-3"
          : "min-w-0"
      }
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#edf3f8] text-[#163b65]">
          <Package
            size={14}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="wrap-break-word text-sm font-semibold text-slate-800">
            {getEquipmentName(
              equipment,
            )}
          </p>

          {equipment
            ?.inventoryNumber && (
            <p className="mt-1 break-all text-xs text-slate-400">
              Inventario{" "}
              {
                equipment.inventoryNumber
              }
            </p>
          )}

          <p className="mt-1.5 text-xs text-slate-500">
            Asignado:{" "}
            <span className="font-medium text-slate-700">
              {assigned}
            </span>

            {" · "}

            Devuelto:{" "}
            <span className="font-medium text-slate-700">
              {returned}
            </span>
          </p>

          {remainingState &&
            remaining > 0 && (
              <span
                className={`mt-2 inline-flex rounded-lg px-2.5 py-1 text-xs font-medium ${remainingState.classes}`}
              >
                {
                  remainingState.label
                }
                :{" "}
                {
                  remainingState.value
                }
              </span>
            )}

          {remaining === 0 &&
            returned > 0 && (
              <span className="mt-2 inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                Devuelto completo
              </span>
            )}
        </div>
      </div>
    </div>
  );
};

/*
 * PROVISIÓN DE ARMAMENTO
 */
const WeaponProvision = ({
  weaponDetails,
  supplyDetails,
  assignment,
}) => {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf3f8] text-[#163b65]">
          <ShieldCheck
            size={17}
          />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#163b65]">
            Provisión de armamento
          </p>

          <p className="mt-0.5 text-xs text-slate-400">
            Armamento y dotación asociada
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        {weaponDetails.map(
          (detail) => (
            <IndividualDetail
              key={detail.id}
              detail={detail}
              compact
            />
          ),
        )}
      </div>

      {supplyDetails.length >
        0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Dotación asociada
          </p>

          <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
            {supplyDetails.map(
              (detail) => {
                const trackingMode =
                  detail.equipment
                    ?.type
                    ?.trackingMode;

                if (
                  trackingMode ===
                  "QUANTITY"
                ) {
                  return (
                    <QuantityDetail
                      key={
                        detail.id
                      }
                      detail={
                        detail
                      }
                      assignment={
                        assignment
                      }
                      compact
                    />
                  );
                }

                return (
                  <IndividualDetail
                    key={
                      detail.id
                    }
                    detail={
                      detail
                    }
                    compact
                  />
                );
              },
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/*
 * EQUIPAMIENTO DE LA ASIGNACIÓN
 */
const AssignmentEquipment = ({
  details,
  assignment,
}) => {
  if (!details?.length) {
    return (
      <span className="text-sm text-slate-400">
        Sin equipamiento
      </span>
    );
  }

  const weaponDetails =
    details.filter(
      (detail) =>
        isWeaponEquipment(
          detail.equipment,
        ),
    );

  /*
   * Si la misma Assignment contiene
   * armamento, el resto se presenta
   * como dotación asociada.
   */
  if (
    weaponDetails.length > 0
  ) {
    const weaponIds =
      new Set(
        weaponDetails.map(
          (detail) =>
            detail.id,
        ),
      );

    const supplyDetails =
      details.filter(
        (detail) =>
          !weaponIds.has(
            detail.id,
          ),
      );

    return (
      <WeaponProvision
        weaponDetails={
          weaponDetails
        }
        supplyDetails={
          supplyDetails
        }
        assignment={
          assignment
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
      {details.map(
        (detail) => {
          const trackingMode =
            detail.equipment
              ?.type
              ?.trackingMode;

          if (
            trackingMode ===
            "QUANTITY"
          ) {
            return (
              <QuantityDetail
                key={detail.id}
                detail={detail}
                assignment={
                  assignment
                }
                compact
              />
            );
          }

          return (
            <IndividualDetail
              key={detail.id}
              detail={detail}
              compact
            />
          );
        },
      )}
    </div>
  );
};

/*
 * SITUACIÓN LOGÍSTICA GENERAL
 *
 * Se calcula desde el tipo de
 * asignación y no se almacena
 * como un campo independiente.
 */
const AssignmentSituation = ({
  assignment,
}) => {
  /*
   * DEVOLUCIÓN DEFINITIVA
   */
  if (
    assignment.returnedAt ||
    assignment.status ===
      "RETURNED"
  ) {
    return (
      <div>
        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
          Devuelto
        </span>

        {assignment.returnedAt && (
          <p className="mt-1.5 text-xs text-slate-500">
            {formatDate(
              assignment.returnedAt,
            )}
          </p>
        )}
      </div>
    );
  }

  /*
   * CANCELADA
   */
  if (
    assignment.status ===
    "CANCELLED"
  ) {
    return (
      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
        Sin asignación activa
      </span>
    );
  }

  /*
   * PERMANENTE
   */
  if (
    assignment.type ===
      "PERMANENT" &&
    assignment.status ===
      "ACTIVE"
  ) {
    return (
      <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
        En poder del oficial
      </span>
    );
  }

  /*
   * TEMPORARIA
   */
  if (
    assignment.type ===
      "TEMPORARY" &&
    assignment.status ===
      "ACTIVE"
  ) {
    return (
      <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
        Sala de Armas
      </span>
    );
  }

  return (
    <span className="text-sm text-slate-400">
      —
    </span>
  );
};

/*
 * BLOQUE DE INFORMACIÓN
 */
const InfoItem = ({
  label,
  children,
  icon = null,
}) => {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
      <div className="flex items-center gap-1.5">
        {icon}

        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>
      </div>

      <div className="mt-2 min-w-0">
        {children}
      </div>
    </div>
  );
};

/*
 * TARJETA DE ASIGNACIÓN
 */
const AssignmentCard = ({
  assignment,
}) => {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300">
      <div className="grid grid-cols-1 xl:grid-cols-[230px_minmax(0,1fr)]">
        {/* PERSONAL */}
        <div className="border-b border-slate-100 bg-slate-50/60 p-5 xl:border-b-0 xl:border-r">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Personal
          </p>

          <div className="mt-3 flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf3f8] text-[#163b65]">
              <UserRound
                size={19}
              />
            </div>

            <div className="min-w-0">
              <p className="wrap-break-word text-sm font-semibold leading-5 text-slate-900">
                {getPersonName(
                  assignment.personnel,
                )}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {assignment
                  .personnel
                  ?.rank ||
                  "Sin grado"}
              </p>

              <p className="mt-1 wrap-break-word text-xs text-slate-400">
                Legajo{" "}
                {assignment
                  .personnel
                  ?.fileNumber ||
                  "—"}
              </p>
            </div>
          </div>
        </div>

        {/* CONTENIDO */}
        <div className="min-w-0 p-5">
          <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1fr)_330px]">
            {/* EQUIPAMIENTO */}
            <div className="min-w-0">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Equipamiento / Dotación
              </p>

              <AssignmentEquipment
                details={
                  assignment.details
                }
                assignment={
                  assignment
                }
              />
            </div>

            {/* DATOS */}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 2xl:grid-cols-2">
              <InfoItem label="Tipo">
                <span className="inline-flex max-w-full rounded-full bg-[#edf3f8] px-2.5 py-1 text-xs font-medium text-[#163b65]">
                  {getAssignmentTypeLabel(
                    assignment.type,
                  )}
                </span>
              </InfoItem>

              <InfoItem label="Estado">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                    assignment.status,
                  )}`}
                >
                  {getAssignmentStatusLabel(
                    assignment.status,
                  )}
                </span>
              </InfoItem>

              <InfoItem
                label="Asignación"
                icon={
                  <CalendarDays
                    size={12}
                    className="text-slate-400"
                  />
                }
              >
                <p className="text-sm font-medium text-slate-700">
                  {formatDate(
                    assignment.assignedAt,
                  )}
                </p>
              </InfoItem>

              <InfoItem label="Situación">
                <AssignmentSituation
                  assignment={
                    assignment
                  }
                />
              </InfoItem>
            </div>
          </div>

          {/* OBSERVACIONES */}
          {assignment.observations && (
            <div className="mt-4 border-t border-slate-100 pt-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Observaciones
              </p>

              <p className="mt-1.5 wrap-break-word text-xs leading-5 text-slate-500">
                {
                  assignment.observations
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

const Assignments = () => {
  const [
    assignments,
    setAssignments,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("ALL");

  const [
    typeFilter,
    setTypeFilter,
  ] = useState("ALL");

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  /*
   * CARGA
   */
  useEffect(() => {
    let ignore = false;

    const loadAssignments =
      async () => {
        try {
          setLoading(true);
          setError("");

          const data =
            await getAssignments();

          if (!ignore) {
            setAssignments(
              Array.isArray(data)
                ? data
                : [],
            );
          }
        } catch (
          loadError
        ) {
          if (!ignore) {
            setAssignments([]);

            setError(
              loadError.message ||
                "No se pudieron cargar las asignaciones",
            );
          }
        } finally {
          if (!ignore) {
            setLoading(false);
          }
        }
      };

    loadAssignments();

    return () => {
      ignore = true;
    };
  }, []);

  /*
   * INDICADORES
   */
  const statistics =
    useMemo(() => {
      return {
        total:
          assignments.length,

        active:
          assignments.filter(
            (assignment) =>
              assignment.status ===
              "ACTIVE",
          ).length,

        returned:
          assignments.filter(
            (assignment) =>
              assignment.status ===
              "RETURNED",
          ).length,

        temporary:
          assignments.filter(
            (assignment) =>
              assignment.type ===
                "TEMPORARY" &&
              assignment.status ===
                "ACTIVE",
          ).length,
      };
    }, [assignments]);

  /*
   * FILTROS
   */
  const filteredAssignments =
    useMemo(() => {
      const normalizedSearch =
        searchTerm
          .trim()
          .toLowerCase();

      return assignments.filter(
        (assignment) => {
          if (
            statusFilter !==
              "ALL" &&
            assignment.status !==
              statusFilter
          ) {
            return false;
          }

          if (
            typeFilter !==
              "ALL" &&
            assignment.type !==
              typeFilter
          ) {
            return false;
          }

          if (!normalizedSearch) {
            return true;
          }

          const equipmentText =
            (
              assignment.details ||
              []
            )
              .flatMap(
                (detail) => [
                  detail.equipment
                    ?.type?.name,

                  detail.equipment
                    ?.brand,

                  detail.equipment
                    ?.model,

                  detail.equipment
                    ?.serialNumber,

                  detail.equipment
                    ?.inventoryNumber,
                ],
              )
              .filter(Boolean)
              .join(" ");

          const searchableText = [
            assignment.personnel
              ?.firstName,

            assignment.personnel
              ?.lastName,

            assignment.personnel
              ?.fileNumber,

            assignment.personnel
              ?.rank,

            getAssignmentTypeLabel(
              assignment.type,
            ),

            assignment.type ===
              "PERMANENT"
              ? "en poder oficial"
              : "",

            assignment.type ===
              "TEMPORARY"
              ? "sala de armas temporaria"
              : "",

            equipmentText,

            assignment.observations,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return searchableText.includes(
            normalizedSearch,
          );
        },
      );
    }, [
      assignments,
      searchTerm,
      statusFilter,
      typeFilter,
    ]);

  /*
   * REINICIAMOS PÁGINA
   * CUANDO CAMBIAN FILTROS.
   */
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    statusFilter,
    typeFilter,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredAssignments.length /
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

  const paginatedAssignments =
    useMemo(() => {
      const startIndex =
        (currentPage - 1) *
        PAGE_SIZE;

      return filteredAssignments.slice(
        startIndex,
        startIndex +
          PAGE_SIZE,
      );
    }, [
      filteredAssignments,
      currentPage,
    ]);

  const firstRecord =
    filteredAssignments.length ===
    0
      ? 0
      : (currentPage - 1) *
          PAGE_SIZE +
        1;

  const lastRecord = Math.min(
    currentPage * PAGE_SIZE,
    filteredAssignments.length,
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* ENCABEZADO */}
      <div className="mb-7">
        <div className="flex items-center gap-2 text-[#163b65]">
          <ClipboardList
            size={19}
          />

          <span className="text-sm font-semibold">
            Gestión de asignaciones
          </span>
        </div>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Asignaciones
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Registro general del equipamiento asignado al personal y su situación logística.
        </p>
      </div>

      {/* INDICADORES */}
      <div className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">
            Asignaciones
          </p>

          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {statistics.total}
          </p>

          <p className="mt-1 hidden text-xs text-slate-500 sm:block">
            Registros históricos
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">
            Activas
          </p>

          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {statistics.active}
          </p>

          <p className="mt-1 hidden text-xs text-slate-500 sm:block">
            Actualmente vigentes
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">
            Devueltas
          </p>

          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {statistics.returned}
          </p>

          <p className="mt-1 hidden text-xs text-slate-500 sm:block">
            Asignaciones cerradas
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">
            Temporarias activas
          </p>

          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {statistics.temporary}
          </p>

          <p className="mt-1 hidden text-xs text-slate-500 sm:block">
            Resguardadas en Sala de Armas
          </p>
        </div>
      </div>

      {/* FILTROS */}
      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* ESTADO */}
            <div className="flex flex-wrap gap-2">
              {[
                [
                  "ALL",
                  "Todas",
                ],
                [
                  "ACTIVE",
                  "Activas",
                ],
                [
                  "RETURNED",
                  "Devueltas",
                ],
                [
                  "CANCELLED",
                  "Canceladas",
                ],
              ].map(
                ([
                  value,
                  label,
                ]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setStatusFilter(
                        value,
                      )
                    }
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

            {/* BUSCADOR */}
            <div className="relative w-full lg:max-w-md">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={searchTerm}
                onChange={(
                  event,
                ) =>
                  setSearchTerm(
                    event.target
                      .value,
                  )
                }
                placeholder="Buscar personal, legajo, equipo o serie..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#7394b2] focus:ring-4 focus:ring-[#163b65]/5"
              />
            </div>
          </div>

          {/* TIPO */}
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
            <span className="mr-1 text-xs font-medium text-slate-400">
              Tipo:
            </span>

            {[
              [
                "ALL",
                "Todos",
              ],
              [
                "PERMANENT",
                "Permanentes",
              ],
              [
                "TEMPORARY",
                "Temporarias",
              ],
            ].map(
              ([
                value,
                label,
              ]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setTypeFilter(
                      value,
                    )
                  }
                  className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                    typeFilter ===
                    value
                      ? "bg-[#edf3f8] text-[#163b65]"
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {label}
                </button>
              ),
            )}
          </div>
        </div>
      </div>

      {/* LISTADO */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-slate-500">
            Cargando asignaciones...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-100 bg-white p-10 text-center shadow-sm">
          <p className="text-sm font-medium text-red-700">
            No se pudieron cargar las asignaciones.
          </p>

          <p className="mt-1 text-xs text-red-500">
            {error}
          </p>
        </div>
      ) : paginatedAssignments.length ===
        0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            <ClipboardList
              size={20}
            />
          </div>

          <p className="mt-3 text-sm font-medium text-slate-700">
            No hay asignaciones para mostrar
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Probá cambiando los filtros o la búsqueda.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedAssignments.map(
              (assignment) => (
                <AssignmentCard
                  key={
                    assignment.id
                  }
                  assignment={
                    assignment
                  }
                />
              ),
            )}
          </div>

          {/* PAGINACIÓN */}
          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              {filteredAssignments.length ===
              0
                ? "0 registros"
                : `Mostrando ${firstRecord}-${lastRecord} de ${filteredAssignments.length} registros`}
            </p>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                disabled={
                  currentPage === 1
                }
                onClick={() =>
                  setCurrentPage(
                    (
                      current,
                    ) =>
                      Math.max(
                        1,
                        current - 1,
                      ),
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
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
                disabled={
                  currentPage ===
                  totalPages
                }
                onClick={() =>
                  setCurrentPage(
                    (
                      current,
                    ) =>
                      Math.min(
                        totalPages,
                        current + 1,
                      ),
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Página siguiente"
              >
                <ChevronRight
                  size={17}
                />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Assignments;