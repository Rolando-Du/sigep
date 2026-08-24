import { useEffect, useRef, useState } from "react";

import { X } from "lucide-react";

import {
  BLOOD_TYPES,
  PERSONNEL_AREAS,
  PERSONNEL_RANKS,
  PERSONNEL_STATUSES,
  PERSONNEL_UNITS,
} from "../../constants/personnel";

const baseInputClasses =
  "w-full rounded-xl border bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400";

const labelClasses = "mb-2 block text-sm font-medium text-slate-700";

const errorTextClasses = "mt-1.5 text-xs font-medium text-red-600";

const getNameParts = (person) => {
  if (!person) {
    return {
      firstName: "",
      lastName: "",
    };
  }

  if (person.firstName || person.lastName) {
    return {
      firstName: person.firstName || "",
      lastName: person.lastName || "",
    };
  }

  const parts = (person.name || "").trim().split(/\s+/);

  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
};

const PersonnelFormModal = ({
  isOpen,
  onClose,
  onSave,
  editingPerson = null,
  errors = {},
  isSaving = false,
}) => {
  const [primaryArea, setPrimaryArea] = useState("");

  const [additionalAreas, setAdditionalAreas] = useState([]);

  /*
   * Referencia al área desplazable
   * del formulario.
   */
  const formRef = useRef(null);

  const isEditing = Boolean(editingPerson);

  const nameParts = getNameParts(editingPerson);

  /*
   * Carga de datos para alta / edición.
   */
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (editingPerson) {
      setPrimaryArea(editingPerson.primaryArea || "");

      setAdditionalAreas(editingPerson.additionalAreas || []);

      return;
    }

    setPrimaryArea("");
    setAdditionalAreas([]);
  }, [isOpen, editingPerson]);

  /*
   * Si el backend devuelve errores,
   * desplazamos automáticamente el
   * formulario hasta el primer campo
   * que necesita corrección.
   */
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const errorFields = Object.keys(errors);

    if (errorFields.length === 0) {
      return;
    }

    const firstErrorField = errorFields[0];

    /*
     * Algunos errores no corresponden
     * directamente a un input.
     */
    const fieldMap = {
      additionalAreas: "additionalAreas-section",
    };

    const targetId = fieldMap[firstErrorField] || firstErrorField;

    const timer = setTimeout(() => {
      const form = formRef.current;

      const target = document.getElementById(targetId);

      if (!form || !target) {
        return;
      }

      const formRect = form.getBoundingClientRect();

      const targetRect = target.getBoundingClientRect();

      /*
       * Calculamos la posición dentro
       * del contenedor con scroll.
       *
       * Dejamos margen superior para
       * que también se vea la etiqueta
       * y el mensaje de error.
       */
      const scrollPosition =
        form.scrollTop + targetRect.top - formRect.top - 70;

      form.scrollTo({
        top: Math.max(0, scrollPosition),
        behavior: "smooth",
      });

      /*
       * Después del scroll damos foco
       * al campo para hacerlo todavía
       * más evidente al usuario.
       */
      if (typeof target.focus === "function") {
        setTimeout(() => {
          target.focus({
            preventScroll: true,
          });
        }, 400);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [errors, isOpen]);

  const getInputClasses = (field) => {
    const hasError = Boolean(errors[field]);

    return `${baseInputClasses} ${
      hasError
        ? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
        : "border-slate-200 focus:border-[#7394b2] focus:ring-4 focus:ring-[#163b65]/5"
    }`;
  };

  const handlePrimaryAreaChange = (event) => {
    const selectedArea = event.target.value;

    setPrimaryArea(selectedArea);

    setAdditionalAreas((currentAreas) =>
      currentAreas.filter((area) => area !== selectedArea),
    );
  };

  const handleAdditionalAreaChange = (area) => {
    setAdditionalAreas((currentAreas) => {
      if (currentAreas.includes(area)) {
        return currentAreas.filter((currentArea) => currentArea !== area);
      }

      return [...currentAreas, area];
    });
  };

  const resetModalState = () => {
    setPrimaryArea("");
    setAdditionalAreas([]);
  };

  const handleClose = () => {
    if (isSaving) {
      return;
    }

    resetModalState();
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    const form = event.currentTarget;

    const formData = new FormData(form);

    const firstName = formData.get("firstName")?.trim() || "";

    const lastName = formData.get("lastName")?.trim() || "";

    const personData = {
      firstName,
      lastName,

      name: `${firstName} ${lastName}`.trim(),

      dni: formData.get("dni")?.trim() || "",

      fileNumber: formData.get("fileNumber")?.trim() || "",

      rank: formData.get("rank") || "",

      bloodType: formData.get("bloodType") || "",

      phone: formData.get("phone")?.trim() || "",

      email: formData.get("email")?.trim() || "",

      addressStreet: formData.get("addressStreet")?.trim() || "",

      addressDetail: formData.get("addressDetail")?.trim() || "",

      addressCity: formData.get("addressCity")?.trim() || "",

      addressProvince: formData.get("addressProvince")?.trim() || "",

      status: formData.get("status") || "Activo",

      unit: formData.get("unit") || "",

      primaryArea,

      additionalAreas,

      dutyFunction: formData.get("dutyFunction")?.trim() || "",

      observations: formData.get("observations")?.trim() || "",
    };

    await onSave(personData);
  };

  if (!isOpen) {
    return null;
  }

  const availableAdditionalAreas = PERSONNEL_AREAS.filter(
    (area) => area !== primaryArea,
  );

  const formKey = editingPerson ? `edit-${editingPerson.id}` : "new-personnel";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6 backdrop-blur-[2px]">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* HEADER */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              {isEditing ? "Editar personal" : "Nuevo personal"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {isEditing
                ? "Modificá los datos del personal seleccionado."
                : "Completá los datos principales del personal."}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSaving}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* FORMULARIO */}
        <form
          ref={formRef}
          key={formKey}
          className="overflow-y-auto scroll-smooth"
          onSubmit={handleSubmit}
          noValidate
          aria-busy={isSaving}
        >
          <div className="grid grid-cols-1 gap-5 px-6 py-6 md:grid-cols-2">
            {/* NOMBRE */}
            <div>
              <label htmlFor="firstName" className={labelClasses}>
                Nombre *
              </label>

              <input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="Ej. Juan"
                defaultValue={nameParts.firstName}
                className={getInputClasses("firstName")}
                aria-invalid={Boolean(errors.firstName)}
                aria-describedby={
                  errors.firstName ? "firstName-error" : undefined
                }
              />

              {errors.firstName && (
                <p id="firstName-error" className={errorTextClasses}>
                  {errors.firstName}
                </p>
              )}
            </div>

            {/* APELLIDO */}
            <div>
              <label htmlFor="lastName" className={labelClasses}>
                Apellido *
              </label>

              <input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Ej. Pérez"
                defaultValue={nameParts.lastName}
                className={getInputClasses("lastName")}
                aria-invalid={Boolean(errors.lastName)}
                aria-describedby={
                  errors.lastName ? "lastName-error" : undefined
                }
              />

              {errors.lastName && (
                <p id="lastName-error" className={errorTextClasses}>
                  {errors.lastName}
                </p>
              )}
            </div>

            {/* DNI */}
            <div>
              <label htmlFor="dni" className={labelClasses}>
                DNI *
              </label>

              <input
                id="dni"
                name="dni"
                type="text"
                inputMode="numeric"
                placeholder="Ej. 30123456"
                defaultValue={editingPerson?.dni || ""}
                className={getInputClasses("dni")}
                aria-invalid={Boolean(errors.dni)}
                aria-describedby={errors.dni ? "dni-error" : undefined}
              />

              {errors.dni && (
                <p id="dni-error" className={errorTextClasses}>
                  {errors.dni}
                </p>
              )}
            </div>

            {/* LEGAJO */}
            <div>
              <label htmlFor="fileNumber" className={labelClasses}>
                N° de legajo *
              </label>

              <input
                id="fileNumber"
                name="fileNumber"
                type="text"
                placeholder="Ej. 503367"
                defaultValue={editingPerson?.fileNumber || ""}
                className={getInputClasses("fileNumber")}
                aria-invalid={Boolean(errors.fileNumber)}
                aria-describedby={
                  errors.fileNumber ? "fileNumber-error" : undefined
                }
              />

              {errors.fileNumber && (
                <p id="fileNumber-error" className={errorTextClasses}>
                  {errors.fileNumber}
                </p>
              )}
            </div>

            {/* GRADO */}
            <div>
              <label htmlFor="rank" className={labelClasses}>
                Grado *
              </label>

              <select
                id="rank"
                name="rank"
                className={getInputClasses("rank")}
                defaultValue={editingPerson?.rank || ""}
                aria-invalid={Boolean(errors.rank)}
                aria-describedby={errors.rank ? "rank-error" : undefined}
              >
                <option value="" disabled>
                  Seleccionar grado
                </option>

                {PERSONNEL_RANKS.map((rank) => (
                  <option key={rank} value={rank}>
                    {rank}
                  </option>
                ))}
              </select>

              {errors.rank && (
                <p id="rank-error" className={errorTextClasses}>
                  {errors.rank}
                </p>
              )}
            </div>

            {/* GRUPO SANGUÍNEO */}
            <div>
              <label htmlFor="bloodType" className={labelClasses}>
                Grupo sanguíneo
              </label>

              <select
                id="bloodType"
                name="bloodType"
                className={getInputClasses("bloodType")}
                defaultValue={editingPerson?.bloodType || ""}
                aria-invalid={Boolean(errors.bloodType)}
                aria-describedby={
                  errors.bloodType ? "bloodType-error" : undefined
                }
              >
                <option value="">Sin especificar</option>

                {BLOOD_TYPES.map((bloodType) => (
                  <option key={bloodType} value={bloodType}>
                    {bloodType}
                  </option>
                ))}
              </select>

              {errors.bloodType && (
                <p id="bloodType-error" className={errorTextClasses}>
                  {errors.bloodType}
                </p>
              )}
            </div>

            {/* DATOS DE CONTACTO */}
            <div className="md:col-span-2 mt-2">
              <div className="border-t border-slate-100 pt-5">
                <h3 className="text-sm font-semibold text-slate-800">
                  Datos de contacto
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Información de contacto y domicilio del personal.
                </p>
              </div>
            </div>

            {/* TELÉFONO */}
            <div>
              <label htmlFor="phone" className={labelClasses}>
                Teléfono
              </label>

              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="Ej. +54 9 2944 123456"
                defaultValue={editingPerson?.phone || ""}
                className={getInputClasses("phone")}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? "phone-error" : undefined}
              />

              {errors.phone && (
                <p id="phone-error" className={errorTextClasses}>
                  {errors.phone}
                </p>
              )}
            </div>

            {/* EMAIL */}
            <div>
              <label htmlFor="email" className={labelClasses}>
                Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                placeholder="Ej. nombre@correo.com"
                defaultValue={editingPerson?.email || ""}
                className={getInputClasses("email")}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
              />

              {errors.email && (
                <p id="email-error" className={errorTextClasses}>
                  {errors.email}
                </p>
              )}
            </div>

            {/* DATOS DE DOMICILIO */}
            <div className="md:col-span-2 mt-2">
              <div className="border-t border-slate-100 pt-5">
                <h3 className="text-sm font-semibold text-slate-800">
                  Datos de domicilio
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Completá la dirección de manera separada para mantener la información ordenada.
                </p>
              </div>
            </div>

            {/* CALLE Y NÚMERO */}
            <div className="md:col-span-2">
              <label htmlFor="addressStreet" className={labelClasses}>
                Calle y número
              </label>

              <input
                id="addressStreet"
                name="addressStreet"
                type="text"
                placeholder="Ej. O'Higgins 578"
                defaultValue={
                  editingPerson?.addressStreet ||
                  editingPerson?.addressLegacy ||
                  ""
                }
                className={getInputClasses("addressStreet")}
                aria-invalid={Boolean(errors.addressStreet)}
                aria-describedby={
                  errors.addressStreet ? "addressStreet-error" : undefined
                }
              />

              {errors.addressStreet && (
                <p id="addressStreet-error" className={errorTextClasses}>
                  {errors.addressStreet}
                </p>
              )}
            </div>

            {/* PISO / DEPARTAMENTO */}
            <div>
              <label htmlFor="addressDetail" className={labelClasses}>
                Piso / Departamento
              </label>

              <input
                id="addressDetail"
                name="addressDetail"
                type="text"
                placeholder="Ej. Piso 2 - Dpto. 1"
                defaultValue={editingPerson?.addressDetail || ""}
                className={getInputClasses("addressDetail")}
                aria-invalid={Boolean(errors.addressDetail)}
                aria-describedby={
                  errors.addressDetail ? "addressDetail-error" : undefined
                }
              />

              {errors.addressDetail && (
                <p id="addressDetail-error" className={errorTextClasses}>
                  {errors.addressDetail}
                </p>
              )}
            </div>

            {/* LOCALIDAD */}
            <div>
              <label htmlFor="addressCity" className={labelClasses}>
                Localidad
              </label>

              <input
                id="addressCity"
                name="addressCity"
                type="text"
                placeholder="Ej. Junín de los Andes"
                defaultValue={editingPerson?.addressCity || ""}
                className={getInputClasses("addressCity")}
                aria-invalid={Boolean(errors.addressCity)}
                aria-describedby={
                  errors.addressCity ? "addressCity-error" : undefined
                }
              />

              {errors.addressCity && (
                <p id="addressCity-error" className={errorTextClasses}>
                  {errors.addressCity}
                </p>
              )}
            </div>

            {/* PROVINCIA */}
            <div className="md:col-span-2">
              <label htmlFor="addressProvince" className={labelClasses}>
                Provincia
              </label>

              <input
                id="addressProvince"
                name="addressProvince"
                type="text"
                placeholder="Ej. Neuquén"
                defaultValue={editingPerson?.addressProvince || "Neuquén"}
                className={getInputClasses("addressProvince")}
                aria-invalid={Boolean(errors.addressProvince)}
                aria-describedby={
                  errors.addressProvince ? "addressProvince-error" : undefined
                }
              />

              {errors.addressProvince && (
                <p id="addressProvince-error" className={errorTextClasses}>
                  {errors.addressProvince}
                </p>
              )}
            </div>

            {/* ESTADO */}
            <div>
              <label htmlFor="status" className={labelClasses}>
                Estado *
              </label>

              <select
                id="status"
                name="status"
                className={getInputClasses("status")}
                defaultValue={editingPerson?.status || "Activo"}
                aria-invalid={Boolean(errors.status)}
                aria-describedby={errors.status ? "status-error" : undefined}
              >
                {PERSONNEL_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              {errors.status && (
                <p id="status-error" className={errorTextClasses}>
                  {errors.status}
                </p>
              )}
            </div>

            {/* UNIDAD */}
            <div>
              <label htmlFor="unit" className={labelClasses}>
                Unidad / Dependencia *
              </label>

              <select
                id="unit"
                name="unit"
                className={getInputClasses("unit")}
                defaultValue={editingPerson?.unit || PERSONNEL_UNITS[0] || ""}
                aria-invalid={Boolean(errors.unit)}
                aria-describedby={errors.unit ? "unit-error" : undefined}
              >
                {PERSONNEL_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>

              {errors.unit && (
                <p id="unit-error" className={errorTextClasses}>
                  {errors.unit}
                </p>
              )}
            </div>

            {/* ÁREA PRINCIPAL */}
            <div>
              <label htmlFor="primaryArea" className={labelClasses}>
                Área principal *
              </label>

              <select
                id="primaryArea"
                name="primaryArea"
                className={getInputClasses("primaryArea")}
                value={primaryArea}
                onChange={handlePrimaryAreaChange}
                aria-invalid={Boolean(errors.primaryArea)}
                aria-describedby={
                  errors.primaryArea ? "primaryArea-error" : undefined
                }
              >
                <option value="" disabled>
                  Seleccionar área
                </option>

                {PERSONNEL_AREAS.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>

              {errors.primaryArea && (
                <p id="primaryArea-error" className={errorTextClasses}>
                  {errors.primaryArea}
                </p>
              )}
            </div>

            {/* FUNCIÓN */}
            <div>
              <label htmlFor="dutyFunction" className={labelClasses}>
                Función
              </label>

              <input
                id="dutyFunction"
                name="dutyFunction"
                type="text"
                placeholder="Ej. Auxiliar de turno"
                defaultValue={editingPerson?.dutyFunction || ""}
                className={getInputClasses("dutyFunction")}
                aria-invalid={Boolean(errors.dutyFunction)}
                aria-describedby={
                  errors.dutyFunction ? "dutyFunction-error" : undefined
                }
              />

              {errors.dutyFunction && (
                <p id="dutyFunction-error" className={errorTextClasses}>
                  {errors.dutyFunction}
                </p>
              )}
            </div>

            {/* ÁREAS ADICIONALES */}
            <div
              id="additionalAreas-section"
              tabIndex={-1}
              className="md:col-span-2"
            >
              <div className="mb-3">
                <p className="text-sm font-medium text-slate-700">
                  Áreas / grupos adicionales
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Seleccioná únicamente si pertenece además a otra área o grupo.
                </p>
              </div>

              <div
                className={`grid grid-cols-2 gap-3 rounded-xl border bg-slate-50 p-4 sm:grid-cols-3 md:grid-cols-4 ${
                  errors.additionalAreas ? "border-red-300" : "border-slate-200"
                }`}
              >
                {availableAdditionalAreas.map((area) => (
                  <label
                    key={area}
                    className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700"
                  >
                    <input
                      type="checkbox"
                      value={area}
                      checked={additionalAreas.includes(area)}
                      onChange={() => handleAdditionalAreaChange(area)}
                      className="h-4 w-4 rounded border-slate-300 accent-[#163b65]"
                    />

                    <span>{area}</span>
                  </label>
                ))}
              </div>

              {errors.additionalAreas && (
                <p id="additionalAreas-error" className={errorTextClasses}>
                  {errors.additionalAreas}
                </p>
              )}
            </div>

            {/* OBSERVACIONES */}
            <div className="md:col-span-2">
              <label htmlFor="observations" className={labelClasses}>
                Observaciones
              </label>

              <textarea
                id="observations"
                name="observations"
                rows={4}
                placeholder="Información adicional..."
                defaultValue={editingPerson?.observations || ""}
                className={`${getInputClasses("observations")} resize-none`}
                aria-invalid={Boolean(errors.observations)}
                aria-describedby={
                  errors.observations ? "observations-error" : undefined
                }
              />

              {errors.observations && (
                <p id="observations-error" className={errorTextClasses}>
                  {errors.observations}
                </p>
              )}
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSaving}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="min-w-35 rounded-xl bg-[#163b65] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#123252] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving
                ? "Guardando..."
                : isEditing
                  ? "Guardar cambios"
                  : "Guardar personal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PersonnelFormModal;