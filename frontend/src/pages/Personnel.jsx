import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Filter,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";

import Swal from "sweetalert2";

import PersonnelFormModal from "../components/personnel/PersonnelFormModal";
import PersonnelDetailModal from "../components/personnel/PersonnelDetailModal";

import {
  PERSONNEL_AREAS,
  PERSONNEL_RANKS,
  PERSONNEL_STATUSES,
} from "../constants/personnel";

import {
  createPersonnel,
  getPersonnel,
  updatePersonnel,
} from "../services/personnel.service";

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
    case "LM":
      return "bg-amber-50 text-amber-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
};

const normalizeText = (value) =>
  String(value ?? "")
    .toLowerCase()
    .trim();

const normalizePerson = (person) => ({
  ...person,
  name: `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim(),
  additionalAreas: person.additionalAreas ?? [],
});

const getFormErrors = (details = []) =>
  details.reduce((errors, detail) => {
    if (detail.field) {
      errors[detail.field] = detail.message;
    }

    return errors;
  }, {});

const selectClasses =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 outline-none transition focus:border-[#7394b2] focus:ring-4 focus:ring-[#163b65]/5";

const showSuccessAlert = (title, text) =>
  Swal.fire({
    icon: "success",
    title,
    text,
    confirmButtonColor: "#163b65",
  });

const showErrorAlert = (title, text) =>
  Swal.fire({
    icon: "error",
    title,
    text,
    confirmButtonColor: "#163b65",
  });

const Personnel = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const [selectedPerson, setSelectedPerson] = useState(null);
  const [editingPerson, setEditingPerson] = useState(null);

  const [personnel, setPersonnel] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formErrors, setFormErrors] = useState({});

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [rankFilter, setRankFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("");

  useEffect(() => {
    const loadPersonnel = async () => {
      try {
        setIsLoading(true);
        const data = await getPersonnel();

        setPersonnel(
          data.map((person) =>
            normalizePerson(person),
          ),
        );
      } catch (error) {
        console.error(
          "Error al cargar personal:",
          error,
        );

        await showErrorAlert(
          "No se pudo cargar el personal",
          error.message ||
            "Verificá que el servidor esté disponible.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadPersonnel();
  }, []);

  const handleNewPersonnel = () => {
    setEditingPerson(null);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleEditPersonnel = (person) => {
    setSelectedPerson(null);
    setEditingPerson(person);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSavePersonnel = async (personData) => {
    setFormErrors({});

    // EDICIÓN
    if (editingPerson) {
      try {
        setIsSaving(true);

        const updatedPerson =
          await updatePersonnel(
            editingPerson.id,
            personData,
          );

        setPersonnel((currentPersonnel) =>
          currentPersonnel.map((person) =>
            person.id === editingPerson.id
              ? normalizePerson(updatedPerson)
              : person,
          ),
        );

        setEditingPerson(null);
        setFormErrors({});
        setIsModalOpen(false);

        await showSuccessAlert(
          "Personal actualizado",
          "Los cambios se guardaron correctamente.",
        );
      } catch (error) {
        console.error(
          "Error al actualizar personal:",
          error,
        );

        if (error.details?.length > 0) {
          setFormErrors(
            getFormErrors(error.details),
          );
        } else {
          await showErrorAlert(
            "No se pudo actualizar",
            error.message ||
              "No se pudo actualizar el personal",
          );
        }
      } finally {
        setIsSaving(false);
      }

      return;
    }

    // NUEVO PERSONAL
    try {
      setIsSaving(true);

      const createdPerson =
        await createPersonnel(personData);

      setPersonnel((currentPersonnel) => [
        normalizePerson(createdPerson),
        ...currentPersonnel,
      ]);

      setFormErrors({});
      setIsModalOpen(false);

      await showSuccessAlert(
        "Personal registrado",
        "El personal se guardó correctamente.",
      );
    } catch (error) {
      console.error(
        "Error al crear personal:",
        error,
      );

      if (error.details?.length > 0) {
        setFormErrors(
          getFormErrors(error.details),
        );
      } else {
        await showErrorAlert(
          "No se pudo registrar",
          error.message ||
            "No se pudo crear el personal",
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseFormModal = () => {
    if (isSaving) {
      return;
    }

    setIsModalOpen(false);
    setEditingPerson(null);
    setFormErrors({});
  };

  const handleClearFilters = () => {
    setStatusFilter("");
    setRankFilter("");
    setAreaFilter("");
  };

  const activeFiltersCount = [
    statusFilter,
    rankFilter,
    areaFilter,
  ].filter(Boolean).length;

  const filteredPersonnel = useMemo(() => {
    const search = normalizeText(searchTerm);

    return personnel.filter((person) => {
      const searchableValues = [
        person.name,
        person.firstName,
        person.lastName,
        person.dni,
        person.fileNumber,
        person.rank,
        person.status,
        person.unit,
        person.primaryArea,
        person.dutyFunction,
        ...(person.additionalAreas ?? []),
      ];

      const matchesSearch =
        !search ||
        searchableValues.some((value) =>
          normalizeText(value).includes(search),
        );

      const matchesStatus =
        !statusFilter ||
        person.status === statusFilter;

      const matchesRank =
        !rankFilter ||
        person.rank === rankFilter;

      const matchesArea =
        !areaFilter ||
        person.primaryArea === areaFilter ||
        (person.additionalAreas ?? []).includes(
          areaFilter,
        );

      return (
        matchesSearch &&
        matchesStatus &&
        matchesRank &&
        matchesArea
      );
    });
  }, [
    personnel,
    searchTerm,
    statusFilter,
    rankFilter,
    areaFilter,
  ]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
      {/* ENCABEZADO */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-[#163b65]">
            <Users size={18} />
            Gestión de personal
          </div>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            Personal
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Consulta y administración del personal registrado en SIGEP.
          </p>
        </div>

        <button
          type="button"
          onClick={handleNewPersonnel}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#163b65] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#123252]"
        >
          <Plus size={18} />
          Nuevo personal
        </button>
      </div>


      {/* BUSCADOR Y FILTROS */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="Buscar por nombre, DNI, legajo, grado o área..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#7394b2] focus:ring-4 focus:ring-[#163b65]/5"
            />
          </div>

          <button
            type="button"
            onClick={() =>
              setIsFiltersOpen(
                (current) => !current,
              )
            }
            className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition ${
              isFiltersOpen ||
              activeFiltersCount > 0
                ? "border-[#163b65]/20 bg-[#edf3f8] text-[#163b65]"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Filter size={18} />

            Filtros

            {activeFiltersCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#163b65] px-1.5 text-[11px] font-semibold text-white">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* PANEL DE FILTROS */}
        {isFiltersOpen && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label
                  htmlFor="statusFilter"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  Estado
                </label>

                <select
                  id="statusFilter"
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value,
                    )
                  }
                  className={selectClasses}
                >
                  <option value="">
                    Todos los estados
                  </option>

                  {PERSONNEL_STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {status}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div>
                <label
                  htmlFor="rankFilter"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  Grado
                </label>

                <select
                  id="rankFilter"
                  value={rankFilter}
                  onChange={(event) =>
                    setRankFilter(
                      event.target.value,
                    )
                  }
                  className={selectClasses}
                >
                  <option value="">
                    Todos los grados
                  </option>

                  {PERSONNEL_RANKS.map(
                    (rank) => (
                      <option
                        key={rank}
                        value={rank}
                      >
                        {rank}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div>
                <label
                  htmlFor="areaFilter"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  Área
                </label>

                <select
                  id="areaFilter"
                  value={areaFilter}
                  onChange={(event) =>
                    setAreaFilter(
                      event.target.value,
                    )
                  }
                  className={selectClasses}
                >
                  <option value="">
                    Todas las áreas
                  </option>

                  {PERSONNEL_AREAS.map(
                    (area) => (
                      <option
                        key={area}
                        value={area}
                      >
                        {area}
                      </option>
                    ),
                  )}
                </select>
              </div>
            </div>

            {activeFiltersCount > 0 && (
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                >
                  <X size={16} />
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* TABLA */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <p className="text-sm font-medium text-slate-800">
            Personal registrado
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {isLoading
              ? "Cargando registros..."
              : `${filteredPersonnel.length} ${
                  filteredPersonnel.length === 1
                    ? "registro mostrado"
                    : "registros mostrados"
                }`}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-212.5 text-left">
            <thead className="bg-slate-50">
              <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3.5">
                  Grado
                </th>

                <th className="px-6 py-3.5">
                  Nombre y apellido
                </th>

                <th className="px-6 py-3.5">
                  DNI
                </th>

                <th className="px-6 py-3.5">
                  Legajo
                </th>

                <th className="px-6 py-3.5">
                  Grupo
                </th>

                <th className="px-6 py-3.5">
                  Estado
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center"
                  >
                    <p className="text-sm text-slate-500">
                      Cargando personal...
                    </p>
                  </td>
                </tr>
              ) : filteredPersonnel.length > 0 ? (
                filteredPersonnel.map(
                  (person) => (
                    <tr
                      key={person.id}
                      onClick={() =>
                        setSelectedPerson(
                          person,
                        )
                      }
                      className="cursor-pointer transition hover:bg-slate-50"
                    >
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {person.rank}
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-900">
                          {person.name}
                        </p>

                        {person.primaryArea && (
                          <p className="mt-1 text-xs text-slate-400">
                            {person.primaryArea}
                          </p>
                        )}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {person.dni}
                      </td>

                      <td className="px-6 py-4 text-sm font-medium text-slate-700">
                        {person.fileNumber}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {person.bloodType || "-"}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                            person.status,
                          )}`}
                        >
                          {person.status}
                        </span>
                      </td>
                    </tr>
                  ),
                )
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center"
                  >
                    <Search
                      size={28}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-3 text-sm font-medium text-slate-700">
                      No se encontraron registros
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Modificá la búsqueda o los filtros seleccionados.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ALTA / EDICIÓN */}
      <PersonnelFormModal
        isOpen={isModalOpen}
        onClose={handleCloseFormModal}
        onSave={handleSavePersonnel}
        editingPerson={editingPerson}
        errors={formErrors}
        isSaving={isSaving}
      />

      {/* FICHA */}
      <PersonnelDetailModal
        person={selectedPerson}
        onClose={() =>
          setSelectedPerson(null)
        }
        onEdit={handleEditPersonnel}
      />
    </div>
  );
};

export default Personnel;