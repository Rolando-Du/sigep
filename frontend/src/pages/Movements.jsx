import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Download,
  History,
  Printer,
  Search,
} from "lucide-react";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import {
  getAssignments,
} from "../services/assignment.service";

const normalizeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString(
    "es-AR",
    {
      dateStyle: "short",
      timeStyle: "short",
    },
  );
};

const getPersonnelName = (assignment) => {
  const firstName =
    assignment.personnel?.firstName || "";

  const lastName =
    assignment.personnel?.lastName || "";

  return (
    `${lastName}, ${firstName}`.replace(
      /^,\s*/,
      "",
    ) || "Sin personal"
  );
};

const getEquipmentSummary = (assignment) => {
  const details = assignment.details || [];

  if (details.length === 0) {
    return "Sin detalle";
  }

  return details
    .map((detail) => {
      const equipment = detail.equipment;
      const typeName =
        equipment?.type?.name ||
        "Equipamiento";

      const quantity =
        detail.quantity || 1;

      const serial =
        equipment?.serialNumber
          ? ` · Serie ${equipment.serialNumber}`
          : "";

      if (quantity > 1) {
        return `${quantity} ${typeName}`;
      }

      return `${typeName}${serial}`;
    })
    .join(" + ");
};

const isPistolProvision = (assignment) => {
  const names = (assignment.details || [])
    .map((detail) =>
      normalizeText(
        detail.equipment?.type?.name,
      ),
    );

  return (
    names.some((name) =>
      name.includes("pistola"),
    ) &&
    names.some((name) =>
      name.includes("cargador"),
    ) &&
    names.some(
      (name) =>
        name.includes("municion") &&
        name.includes("9"),
    )
  );
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const getFilterLabel = (filter) => {
  if (filter === "ASSIGNMENT") {
    return "Asignaciones";
  }

  if (filter === "RETURN") {
    return "Devoluciones";
  }

  return "Todos los movimientos";
};

const Movements = () => {
  const [assignments, setAssignments] =
    useState([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState("ALL");

  useEffect(() => {
    const loadMovements = async () => {
      try {
        setIsLoading(true);
        setError("");

        const data =
          await getAssignments();

        setAssignments(
          Array.isArray(data) ? data : [],
        );
      } catch (loadError) {
        setError(
          loadError.message ||
            "No se pudieron cargar los movimientos",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadMovements();
  }, []);

  const movements = useMemo(() => {
    const rows = [];

    assignments.forEach((assignment) => {
      rows.push({
        id: `assignment-${assignment.id}`,
        kind: "ASSIGNMENT",
        date:
          assignment.assignedAt ||
          assignment.createdAt,
        title:
          assignment.type === "PERMANENT"
            ? "Asignación permanente"
            : "Asignación temporaria",
        personnel:
          getPersonnelName(assignment),
        equipment:
          getEquipmentSummary(assignment),
        observations:
          assignment.observations || "",
      });

      if (assignment.returnedAt) {
        rows.push({
          id: `return-${assignment.id}`,
          kind: "RETURN",
          date: assignment.returnedAt,
          title: isPistolProvision(
            assignment,
          )
            ? "Devolución de provisión"
            : "Devolución de equipamiento",
          personnel:
            getPersonnelName(assignment),
          equipment:
            getEquipmentSummary(assignment),
          observations:
            assignment.observations || "",
        });
      }
    });

    return rows.sort(
      (a, b) =>
        new Date(b.date).getTime() -
        new Date(a.date).getTime(),
    );
  }, [assignments]);

  const filteredMovements =
    useMemo(() => {
      const query = normalizeText(search);

      return movements.filter(
        (movement) => {
          if (
            filter !== "ALL" &&
            movement.kind !== filter
          ) {
            return false;
          }

          if (!query) {
            return true;
          }

          return normalizeText(
            `${movement.title} ${movement.personnel} ${movement.equipment} ${movement.observations}`,
          ).includes(query);
        },
      );
    }, [movements, search, filter]);

  // IMPRIMIR
  const handlePrint = () => {
    const printWindow = window.open(
      "",
      "_blank",
      "width=1200,height=800",
    );

    if (!printWindow) {
      return;
    }

    const rows = filteredMovements
      .map(
        (movement) => `
          <tr>
            <td>${escapeHtml(formatDate(movement.date))}</td>
            <td>${escapeHtml(movement.title)}</td>
            <td>${escapeHtml(movement.personnel)}</td>
            <td>${escapeHtml(movement.equipment)}</td>
            <td>${escapeHtml(movement.observations || "-")}</td>
          </tr>
        `,
      )
      .join("");

    printWindow.document.write(`
      <!doctype html>
      <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <title>SIGEP - Movimientos</title>
          <style>
            * {
              box-sizing: border-box;
            }

            body {
              margin: 32px;
              color: #0f172a;
              font-family: Arial, sans-serif;
            }

            h1 {
              margin: 0;
              font-size: 24px;
            }

            .subtitle {
              margin: 6px 0 4px;
              color: #475569;
              font-size: 13px;
            }

            .meta {
              margin: 0 0 22px;
              color: #64748b;
              font-size: 12px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
            }

            th,
            td {
              border: 1px solid #cbd5e1;
              padding: 8px;
              text-align: left;
              vertical-align: top;
            }

            th {
              background: #f1f5f9;
              font-weight: 700;
            }

            @page {
              size: landscape;
              margin: 12mm;
            }
          </style>
        </head>

        <body>
          <h1>SIGEP - Historial de movimientos</h1>

          <p class="subtitle">
            ${escapeHtml(getFilterLabel(filter))}
          </p>

          <p class="meta">
            Generado: ${escapeHtml(
              new Date().toLocaleString("es-AR"),
            )}
            · Registros: ${filteredMovements.length}
          </p>

          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Movimiento</th>
                <th>Personal</th>
                <th>Equipamiento</th>
                <th>Observaciones</th>
              </tr>
            </thead>

            <tbody>
              ${rows}
            </tbody>
          </table>

          <script>
            window.onload = () => {
              window.print();
              window.onafterprint = () => window.close();
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  // DESCARGAR PDF
  const handleDownloadPdf = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    doc.setFontSize(18);
    doc.text(
      "SIGEP - Historial de movimientos",
      14,
      16,
    );

    doc.setFontSize(10);
    doc.text(
      `Filtro: ${getFilterLabel(filter)}`,
      14,
      23,
    );

    doc.text(
      `Generado: ${new Date().toLocaleString("es-AR")}`,
      14,
      29,
    );

    doc.text(
      `Registros: ${filteredMovements.length}`,
      14,
      35,
    );

    autoTable(doc, {
      startY: 41,
      head: [
        [
          "Fecha",
          "Movimiento",
          "Personal",
          "Equipamiento",
          "Observaciones",
        ],
      ],
      body: filteredMovements.map(
        (movement) => [
          formatDate(movement.date),
          movement.title,
          movement.personnel,
          movement.equipment,
          movement.observations || "-",
        ],
      ),
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        overflow: "linebreak",
        valign: "top",
      },
      headStyles: {
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 40 },
        2: { cellWidth: 45 },
        3: { cellWidth: 95 },
        4: { cellWidth: 60 },
      },
      margin: {
        left: 14,
        right: 14,
      },
    });

    const fileDate = new Date()
      .toISOString()
      .slice(0, 10);

    doc.save(
      `SIGEP-movimientos-${fileDate}.pdf`,
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <History
              size={24}
              className="text-[#163b65]"
            />

            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Movimientos
            </h1>
          </div>

          <p className="mt-2 text-sm text-slate-500">
            Historial de asignaciones y
            devoluciones registradas en SIGEP.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handlePrint}
            disabled={
              isLoading ||
              filteredMovements.length === 0
            }
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Printer size={17} />
            Imprimir
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={
              isLoading ||
              filteredMovements.length === 0
            }
            className="inline-flex items-center gap-2 rounded-xl bg-[#163b65] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#123252] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={17} />
            Descargar PDF
          </button>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Movimientos
            </p>

            <p className="mt-1 text-xl font-semibold text-slate-900">
              {filteredMovements.length}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Buscar por personal o equipamiento..."
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#7394b2] focus:ring-4 focus:ring-[#163b65]/5"
          />
        </div>

        <select
          value={filter}
          onChange={(event) =>
            setFilter(event.target.value)
          }
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
        >
          <option value="ALL">
            Todos los movimientos
          </option>

          <option value="ASSIGNMENT">
            Asignaciones
          </option>

          <option value="RETURN">
            Devoluciones
          </option>
        </select>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {isLoading ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            Cargando movimientos...
          </div>
        ) : filteredMovements.length ===
          0 ? (
          <div className="px-6 py-12 text-center">
            <History
              size={32}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 text-sm font-medium text-slate-600">
              No hay movimientos para mostrar.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-225">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-4">
                    Fecha
                  </th>

                  <th className="px-5 py-4">
                    Movimiento
                  </th>

                  <th className="px-5 py-4">
                    Personal
                  </th>

                  <th className="px-5 py-4">
                    Equipamiento
                  </th>

                  <th className="px-5 py-4">
                    Observaciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredMovements.map(
                  (movement) => (
                    <tr
                      key={movement.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                        {formatDate(
                          movement.date,
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                              movement.kind ===
                              "RETURN"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-blue-50 text-[#163b65]"
                            }`}
                          >
                            {movement.kind ===
                            "RETURN" ? (
                              <ArrowDownToLine
                                size={17}
                              />
                            ) : (
                              <ArrowUpFromLine
                                size={17}
                              />
                            )}
                          </div>

                          <span className="text-sm font-medium text-slate-800">
                            {movement.title}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm font-medium text-slate-700">
                        {movement.personnel}
                      </td>

                      <td className="max-w-md px-5 py-4 text-sm text-slate-600">
                        {movement.equipment}
                      </td>

                      <td className="max-w-xs px-5 py-4 text-sm text-slate-500">
                        {movement.observations ||
                          "-"}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Movements;