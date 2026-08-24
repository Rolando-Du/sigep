import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  Droplets,
  FileText,
  Fingerprint,
  History,
  IdCard,
  Layers3,
  Mail,
  MapPin,
  Package,
  Phone,
  Plus,
  RotateCcw,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

import {
  getPersonnelAssignments,
} from "../../services/assignment.service";

import PersonnelAssignmentModal from "./PersonnelAssignmentModal";
import PersonnelReturnModal from "./PersonnelReturnModal";
import PersonnelEquipmentHistoryModal from "./PersonnelEquipmentHistoryModal";

const getStatusClasses = (status) => {
  switch (status) {
    case "Activo":
      return "bg-emerald-50 text-emerald-700";

    case "ETB":
    case "ETP":
      return "bg-blue-50 text-blue-700";

    case "LEF":
    case "LAO":
    case "LAP":
    case "LES":
    case "LPM":
    case "LPL":
      return "bg-amber-50 text-amber-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
};

const DetailItem = ({
  icon: Icon,
  label,
  value,
}) => {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#163b65] shadow-sm">
          <Icon
            size={18}
            strokeWidth={1.8}
          />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {label}
          </p>

          <p className="mt-1 wrap-break-word text-sm font-medium text-slate-800">
            {value || "Sin especificar"}
          </p>
        </div>
      </div>
    </div>
  );
};

const getPersonName = (person) => {
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

const getAddress = (person) => {
  const street =
    person.addressStreet?.trim();

  const detail =
    person.addressDetail?.trim();

  const city =
    person.addressCity?.trim();

  const province =
    person.addressProvince?.trim();

  const firstLine = [
    street,
    detail,
  ]
    .filter(Boolean)
    .join(", ");

  const secondLine = [
    city,
    province,
  ]
    .filter(Boolean)
    .join(", ");

  const structuredAddress = [
    firstLine,
    secondLine,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    structuredAddress ||
    person.addressLegacy ||
    "Sin especificar"
  );
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

const getLogisticSituationLabel = (
  type,
) => {
  if (type === "PERMANENT") {
    return "En poder del oficial";
  }

  if (type === "TEMPORARY") {
    return "Sala de Armas";
  }

  return "Sin especificar";
};

const getLogisticSituationClasses = (
  type,
) => {
  if (type === "PERMANENT") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (type === "TEMPORARY") {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-slate-100 text-slate-600";
};

const getEquipmentIdentification = (
  equipment,
) => {
  if (equipment.serialNumber) {
    return `Serie ${equipment.serialNumber}`;
  }

  if (equipment.inventoryNumber) {
    return `Inventario ${equipment.inventoryNumber}`;
  }

  return "Sin identificación";
};

const getEquipmentName = (
  equipment,
) => {
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

const formatDateTime = (value) => {
  if (!value) {
    return "Sin registrar";
  }

  const date = new Date(value);

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

  if (status === "CANCELLED") {
    return "bg-slate-100 text-slate-600";
  }

  return "bg-slate-100 text-slate-600";
};

const PersonnelDetailModal = ({
  person,
  onClose,
  onEdit,
}) => {
  const [
    assignments,
    setAssignments,
  ] = useState([]);

  const [
    assignmentsLoading,
    setAssignmentsLoading,
  ] = useState(false);

  const [
    assignmentsError,
    setAssignmentsError,
  ] = useState("");

  const [
    isAssignmentModalOpen,
    setIsAssignmentModalOpen,
  ] = useState(false);

  const [
    returnItem,
    setReturnItem,
  ] = useState(null);

  const [
    isHistoryModalOpen,
    setIsHistoryModalOpen,
  ] = useState(false);

  const [
    assignmentsRefreshKey,
    setAssignmentsRefreshKey,
  ] = useState(0);

  useEffect(() => {
    if (!person?.id) {
      setAssignments([]);
      setAssignmentsError("");

      return;
    }

    let ignore = false;

    const loadAssignments =
      async () => {
        try {
          setAssignmentsLoading(
            true,
          );

          setAssignmentsError("");

          const data =
            await getPersonnelAssignments(
              person.id,
            );

          if (!ignore) {
            setAssignments(
              Array.isArray(data)
                ? data
                : [],
            );
          }
        } catch (error) {
          if (!ignore) {
            setAssignments([]);

            setAssignmentsError(
              error.message ||
                "No se pudieron obtener las asignaciones",
            );
          }
        } finally {
          if (!ignore) {
            setAssignmentsLoading(
              false,
            );
          }
        }
      };

    loadAssignments();

    return () => {
      ignore = true;
    };
  }, [
    person?.id,
    assignmentsRefreshKey,
  ]);

  /*
   * EQUIPAMIENTO ACTUALMENTE ASIGNADO
   */
  const activeEquipment =
    useMemo(() => {
      const grouped =
        new Map();

      assignments
        .filter(
          (assignment) =>
            assignment.status ===
            "ACTIVE",
        )
        .forEach(
          (assignment) => {
            assignment.details?.forEach(
              (detail) => {
                const outstandingQuantity =
                  Math.max(
                    0,
                    (detail.quantity ||
                      0) -
                      (detail.returnedQuantity ||
                        0),
                  );

                if (
                  outstandingQuantity <=
                    0 ||
                  !detail.equipment
                ) {
                  return;
                }

                const equipment =
                  detail.equipment;

                const current =
                  grouped.get(
                    equipment.id,
                  );

                const source = {
                  assignmentId:
                    assignment.id,

                  detailId:
                    detail.id,

                  quantity:
                    outstandingQuantity,

                  assignmentType:
                    assignment.type,

                  assignedAt:
                    assignment.assignedAt,
                };

                if (current) {
                  current.quantity +=
                    outstandingQuantity;

                  current.sources.push(
                    source,
                  );

                  if (
                    assignment.type ===
                    "PERMANENT"
                  ) {
                    current.hasPermanent =
                      true;
                  }

                  if (
                    assignment.type ===
                    "TEMPORARY"
                  ) {
                    current.hasTemporary =
                      true;
                  }

                  return;
                }

                grouped.set(
                  equipment.id,
                  {
                    equipment,

                    quantity:
                      outstandingQuantity,

                    hasPermanent:
                      assignment.type ===
                      "PERMANENT",

                    hasTemporary:
                      assignment.type ===
                      "TEMPORARY",

                    sources: [
                      source,
                    ],
                  },
                );
              },
            );
          },
        );

      return Array.from(
        grouped.values(),
      );
    }, [assignments]);

  /*
   * HISTORIAL LOGÍSTICO
   */
  const equipmentHistory =
    useMemo(() => {
      return assignments.flatMap(
        (assignment) =>
          (assignment.details || [])
            .filter(
              (detail) =>
                detail.equipment,
            )
            .map((detail) => ({
              assignmentId:
                assignment.id,

              assignmentType:
                assignment.type,

              assignmentStatus:
                assignment.status,

              assignedAt:
                assignment.assignedAt,

              returnedAt:
                assignment.returnedAt,

              observations:
                assignment.observations,

              detailId:
                detail.id,

              quantity:
                detail.quantity || 0,

              returnedQuantity:
                detail.returnedQuantity ||
                0,

              equipment:
                detail.equipment,
            })),
      );
    }, [assignments]);

  /*
   * ARMAMENTO PERMANENTE
   *
   * Solo consideramos armamento
   * provisto cuando existe una
   * asignación PERMANENT activa.
   */
  const hasIssuedWeapon =
    activeEquipment.some(
      ({
        equipment,
        hasPermanent,
      }) => {
        const typeName =
          equipment.type?.name
            ?.trim()
            .toLowerCase() ||
          "";

        return (
          hasPermanent &&
          (
            typeName.includes(
              "pistola",
            ) ||
            typeName.includes(
              "armamento",
            )
          )
        );
      },
    );

  const handleAssignmentCreated =
    async () => {
      setAssignmentsRefreshKey(
        (current) =>
          current + 1,
      );
    };

  const handleEquipmentReturned =
    async () => {
      setReturnItem(null);

      setAssignmentsRefreshKey(
        (current) =>
          current + 1,
      );
    };

  const openReturnModal = ({
    equipment,
    source,
  }) => {
    setReturnItem({
      assignmentId:
        source.assignmentId,

      detailId:
        source.detailId,

      equipment,

      quantity:
        source.quantity,

      assignmentType:
        source.assignmentType,

      isIndividual:
        equipment.type
          ?.trackingMode ===
        "INDIVIDUAL",
    });
  };

  if (!person) {
    return null;
  }

  const fullName =
    getPersonName(person);

  const fullAddress =
    getAddress(person);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6 backdrop-blur-[2px]">
        <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          {/* HEADER */}
          <div className="border-b border-slate-100 px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#edf3f8] text-[#163b65]">
                  <UserRound
                    size={23}
                    strokeWidth={1.8}
                  />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                      {fullName}
                    </h2>

                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                        person.status,
                      )}`}
                    >
                      {person.status}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    {person.rank}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* CONTENIDO */}
          <div className="overflow-y-auto px-6 py-6">
            {/* DATOS PERSONALES */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Datos personales
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <DetailItem
                icon={Fingerprint}
                label="DNI"
                value={person.dni}
              />

              <DetailItem
                icon={IdCard}
                label="N° de legajo"
                value={
                  person.fileNumber
                }
              />

              <DetailItem
                icon={ShieldCheck}
                label="Grado"
                value={person.rank}
              />

              <DetailItem
                icon={Droplets}
                label="Grupo sanguíneo"
                value={
                  person.bloodType
                }
              />
            </div>

            {/* DATOS DE CONTACTO */}
            <div className="mb-4 mt-7">
              <h3 className="text-sm font-semibold text-slate-900">
                Datos de contacto
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <DetailItem
                icon={Phone}
                label="Teléfono"
                value={person.phone}
              />

              <DetailItem
                icon={Mail}
                label="Email"
                value={person.email}
              />

              <div className="md:col-span-2">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#163b65] shadow-sm">
                      <MapPin
                        size={18}
                        strokeWidth={
                          1.8
                        }
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Domicilio
                      </p>

                      <p className="mt-1 whitespace-pre-line wrap-break-word text-sm font-medium leading-relaxed text-slate-800">
                        {
                          fullAddress
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* DESTINO */}
            <div className="mb-4 mt-7">
              <h3 className="text-sm font-semibold text-slate-900">
                Destino y función
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <DetailItem
                icon={Building2}
                label="Unidad / Dependencia"
                value={person.unit}
              />

              <DetailItem
                icon={Layers3}
                label="Área principal"
                value={
                  person.primaryArea
                }
              />

              <DetailItem
                icon={
                  BriefcaseBusiness
                }
                label="Función"
                value={
                  person.dutyFunction
                }
              />

              <DetailItem
                icon={BadgeCheck}
                label="Estado"
                value={
                  person.status
                }
              />
            </div>

            {/* ÁREAS ADICIONALES */}
            <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Áreas / grupos adicionales
              </p>

              {person
                .additionalAreas
                ?.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {person.additionalAreas.map(
                    (area) => (
                      <span
                        key={area}
                        className="rounded-lg border border-[#163b65]/10 bg-[#edf3f8] px-3 py-1.5 text-xs font-medium text-[#163b65]"
                      >
                        {area}
                      </span>
                    ),
                  )}
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-500">
                  Sin áreas adicionales.
                </p>
              )}
            </div>

            {/* EQUIPAMIENTO ASIGNADO */}
            <div className="mb-4 mt-7 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Equipamiento asignado
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Elementos actualmente asignados al personal y su situación logística.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!assignmentsLoading &&
                  !assignmentsError && (
                    <span
                      className={`inline-flex rounded-full px-3 py-1.5 text-xs font-medium ${
                        hasIssuedWeapon
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      Armamento
                      provisto:{" "}
                      {hasIssuedWeapon
                        ? "Sí"
                        : "No"}
                    </span>
                  )}

                <button
                  type="button"
                  onClick={() =>
                    setIsAssignmentModalOpen(
                      true,
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-[#163b65] px-3.5 py-2 text-xs font-medium text-white transition hover:bg-[#123252]"
                >
                  <Plus size={16} />

                  Asignar equipamiento
                </button>
              </div>
            </div>

            {assignmentsLoading ? (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-5 text-sm text-slate-500">
                Cargando equipamiento
                asignado...
              </div>
            ) : assignmentsError ? (
              <div className="rounded-xl border border-red-100 bg-red-50 p-5">
                <p className="text-sm font-medium text-red-700">
                  No se pudo cargar el
                  equipamiento asignado.
                </p>

                <p className="mt-1 text-xs text-red-600">
                  {assignmentsError}
                </p>
              </div>
            ) : activeEquipment.length ===
              0 ? (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#163b65] shadow-sm">
                    <Package
                      size={18}
                      strokeWidth={
                        1.8
                      }
                    />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      Sin equipamiento
                      asignado
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      No hay
                      asignaciones
                      activas
                      registradas.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {activeEquipment.map(
                  ({
                    equipment,
                    quantity,
                    hasPermanent,
                    hasTemporary,
                    sources,
                  }) => {
                    const trackingMode =
                      equipment.type
                        ?.trackingMode;

                    const assignmentLabel =
                      hasPermanent &&
                      hasTemporary
                        ? "Permanente / Temporaria"
                        : hasPermanent
                          ? getAssignmentTypeLabel(
                              "PERMANENT",
                            )
                          : getAssignmentTypeLabel(
                              "TEMPORARY",
                            );

                    const situationLabel =
                      hasPermanent &&
                      hasTemporary
                        ? "Situación mixta"
                        : hasPermanent
                          ? getLogisticSituationLabel(
                              "PERMANENT",
                            )
                          : getLogisticSituationLabel(
                              "TEMPORARY",
                            );

                    const situationClasses =
                      hasPermanent &&
                      hasTemporary
                        ? "bg-violet-50 text-violet-700"
                        : hasPermanent
                          ? getLogisticSituationClasses(
                              "PERMANENT",
                            )
                          : getLogisticSituationClasses(
                              "TEMPORARY",
                            );

                    return (
                      <div
                        key={
                          equipment.id
                        }
                        className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#163b65] shadow-sm">
                            <Package
                              size={
                                19
                              }
                              strokeWidth={
                                1.8
                              }
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="wrap-break-word text-sm font-semibold text-slate-900">
                                  {getEquipmentName(
                                    equipment,
                                  )}
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  {trackingMode ===
                                  "INDIVIDUAL"
                                    ? getEquipmentIdentification(
                                        equipment,
                                      )
                                    : `Cantidad asignada: ${quantity}`}
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

                              <div className="flex flex-wrap items-center justify-end gap-2">
                                <span className="rounded-full bg-[#edf3f8] px-2.5 py-1 text-xs font-medium text-[#163b65]">
                                  {
                                    assignmentLabel
                                  }
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

                            {trackingMode ===
                              "INDIVIDUAL" && (
                              <p className="mt-2 text-xs text-slate-500">
                                Cantidad
                                asignada:{" "}
                                {
                                  quantity
                                }
                              </p>
                            )}

                            <div className="mt-4 border-t border-slate-200/70 pt-3">
                              {sources.length ===
                              1 ? (
                                <div className="flex justify-end">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openReturnModal({
                                        equipment,
                                        source:
                                          sources[0],
                                      })
                                    }
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-[#163b65]/20 hover:bg-[#edf3f8] hover:text-[#163b65]"
                                  >
                                    <RotateCcw
                                      size={14}
                                    />

                                    Devolver equipamiento
                                  </button>
                                </div>
                              ) : (
                                <div>
                                  <p className="mb-2 text-xs text-slate-500">
                                    Este stock pertenece a{" "}
                                    {sources.length} asignaciones activas. Seleccioná cuál devolver:
                                  </p>

                                  <div className="flex flex-wrap gap-2">
                                    {sources.map(
                                      (
                                        source,
                                        index,
                                      ) => (
                                        <button
                                          key={`${source.assignmentId}-${source.detailId}`}
                                          type="button"
                                          onClick={() =>
                                            openReturnModal({
                                              equipment,
                                              source,
                                            })
                                          }
                                          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-[#163b65]/20 hover:bg-[#edf3f8] hover:text-[#163b65]"
                                        >
                                          <RotateCcw
                                            size={14}
                                          />

                                          Devolver asignación{" "}
                                          {index + 1} (
                                          {source.quantity})
                                        </button>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            )}

            {/* HISTORIAL DE EQUIPAMIENTO */}
            <div className="mb-4 mt-7 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <History
                  size={17}
                  className="text-[#163b65]"
                />

                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Historial de equipamiento
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Resumen de asignaciones y devoluciones definitivas registradas.
                  </p>
                </div>
              </div>

              {!assignmentsLoading &&
                !assignmentsError &&
                equipmentHistory.length >
                  0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setIsHistoryModalOpen(
                        true,
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 transition hover:border-[#163b65]/20 hover:bg-[#edf3f8] hover:text-[#163b65]"
                  >
                    <History size={15} />

                    Ver historial completo
                  </button>
                )}
            </div>

            {assignmentsLoading ? (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-5 text-sm text-slate-500">
                Cargando historial...
              </div>
            ) : assignmentsError ? (
              <div className="rounded-xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">
                No se pudo cargar el historial de equipamiento.
              </div>
            ) : equipmentHistory.length ===
              0 ? (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-5 text-sm text-slate-500">
                No hay registros de equipamiento.
              </div>
            ) : (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Registros de equipamiento
                    </p>

                    <p className="mt-1 text-2xl font-semibold text-slate-900">
                      {equipmentHistory.length}
                    </p>
                  </div>

                  <div className="max-w-sm text-right">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Último registro
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {getEquipmentName(
                        equipmentHistory[0]
                          .equipment,
                      )}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {getAssignmentTypeLabel(
                        equipmentHistory[0]
                          .assignmentType,
                      )}

                      {" · "}

                      {getAssignmentStatusLabel(
                        equipmentHistory[0]
                          .assignmentStatus,
                      )}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {formatDateTime(
                        equipmentHistory[0]
                          .assignedAt,
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* OBSERVACIONES */}
            <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center gap-2">
                <FileText
                  size={17}
                  className="text-[#163b65]"
                />

                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Observaciones
                </p>
              </div>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {person.observations ||
                  "Sin observaciones registradas."}
              </p>
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Cerrar
            </button>

            <button
              type="button"
              onClick={() =>
                onEdit(person)
              }
              className="rounded-xl bg-[#163b65] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#123252]"
            >
              Editar personal
            </button>
          </div>
        </div>
      </div>

      <PersonnelAssignmentModal
        isOpen={
          isAssignmentModalOpen
        }
        onClose={() =>
          setIsAssignmentModalOpen(
            false,
          )
        }
        person={person}
        onCreated={
          handleAssignmentCreated
        }
      />

      <PersonnelReturnModal
        isOpen={Boolean(
          returnItem,
        )}
        onClose={() =>
          setReturnItem(null)
        }
        item={returnItem}
        onReturned={
          handleEquipmentReturned
        }
      />

      <PersonnelEquipmentHistoryModal
        isOpen={
          isHistoryModalOpen
        }
        onClose={() =>
          setIsHistoryModalOpen(
            false,
          )
        }
        person={person}
        history={
          equipmentHistory
        }
      />
    </>
  );
};

export default PersonnelDetailModal;