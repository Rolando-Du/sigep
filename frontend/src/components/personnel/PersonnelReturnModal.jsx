import {
  useEffect,
  useState,
} from "react";

import {
  PackageCheck,
  RotateCcw,
  X,
} from "lucide-react";

import {
  returnAssignmentDetail,
} from "../../services/assignment.service";

const PersonnelReturnModal = ({
  isOpen,
  onClose,
  item,
  onReturned,
}) => {
  const [quantity, setQuantity] =
    useState(1);

  const [isSaving, setIsSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!isOpen || !item) {
      return;
    }

    setQuantity(
      item.isIndividual
        ? 1
        : item.quantity,
    );

    setError("");
  }, [isOpen, item]);

  if (!isOpen || !item) {
    return null;
  }

  const {
    assignmentId,
    detailId,
    equipment,
    quantity: pendingQuantity,
    isIndividual,
  } = item;

  const equipmentName = [
    equipment?.type?.name,
    equipment?.brand,
    equipment?.model,
  ]
    .filter(Boolean)
    .join(" ");

  const identification =
    equipment?.serialNumber
      ? `Serie ${equipment.serialNumber}`
      : equipment?.inventoryNumber
        ? `Inventario ${equipment.inventoryNumber}`
        : null;

  const handleClose = () => {
    if (isSaving) {
      return;
    }

    onClose();
  };

  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    const returnQuantity =
      Number(quantity);

    if (
      !Number.isInteger(
        returnQuantity,
      ) ||
      returnQuantity <= 0
    ) {
      setError(
        "Ingresá una cantidad válida",
      );

      return;
    }

    if (
      returnQuantity >
      pendingQuantity
    ) {
      setError(
        `La cantidad máxima a devolver es ${pendingQuantity}`,
      );

      return;
    }

    if (
      isIndividual &&
      returnQuantity !== 1
    ) {
      setError(
        "El equipamiento individual debe devolverse completo",
      );

      return;
    }

    try {
      setIsSaving(true);
      setError("");

      const updatedAssignment =
        await returnAssignmentDetail({
          assignmentId,
          detailId,
          quantity:
            returnQuantity,
        });

      if (onReturned) {
        await onReturned(
          updatedAssignment,
        );
      }

      onClose();
    } catch (saveError) {
      const detailMessage =
        saveError.details?.[0]
          ?.message;

      setError(
        detailMessage ||
          saveError.message ||
          "No se pudo registrar la devolución",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-slate-900/40 px-4 py-6 backdrop-blur-[2px]">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* HEADER */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf3f8] text-[#163b65]">
              <RotateCcw
                size={20}
                strokeWidth={1.8}
              />
            </div>

            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                Devolver equipamiento
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Registrá la devolución del elemento seleccionado.
              </p>
            </div>
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
        >
          <div className="space-y-5 px-6 py-6">
            {/* EQUIPAMIENTO */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#163b65] shadow-sm">
                  <PackageCheck
                    size={19}
                    strokeWidth={1.8}
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    {equipmentName}
                  </p>

                  {identification && (
                    <p className="mt-1 text-xs text-slate-500">
                      {identification}
                    </p>
                  )}

                  <p className="mt-2 text-xs font-medium text-slate-600">
                    Cantidad pendiente:{" "}
                    {pendingQuantity}
                  </p>
                </div>
              </div>
            </div>

            {/* CANTIDAD */}
            {isIndividual ? (
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Cantidad a devolver
                </p>

                <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                  1 unidad
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Los equipos individuales se devuelven completos.
                </p>
              </div>
            ) : (
              <div>
                <label
                  htmlFor="returnQuantity"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Cantidad a devolver
                </label>

                <input
                  id="returnQuantity"
                  type="number"
                  min="1"
                  max={
                    pendingQuantity
                  }
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-[#7394b2] focus:ring-4 focus:ring-[#163b65]/5"
                />

                <p className="mt-2 text-xs text-slate-500">
                  Podés devolver entre 1 y{" "}
                  {pendingQuantity} unidades.
                </p>
              </div>
            )}

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
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-[#163b65] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#123252] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw
                size={17}
              />

              {isSaving
                ? "Devolviendo..."
                : "Confirmar devolución"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PersonnelReturnModal;