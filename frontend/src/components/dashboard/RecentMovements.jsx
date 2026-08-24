import { ChevronRight } from "lucide-react";

const RecentMovements = ({ movements }) => {
  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
        <div>
          <h4 className="font-semibold text-slate-900">
            Movimientos recientes
          </h4>

          <p className="mt-1 text-xs text-slate-500">
            Últimas asignaciones y devoluciones registradas.
          </p>
        </div>

        <button
          type="button"
          className="flex items-center gap-1 text-sm font-medium text-[#163b65] hover:underline"
        >
          Ver todos
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="divide-y divide-slate-100">
        {movements.map((movement) => (
          <div
            key={`${movement.person}-${movement.element}`}
            className="flex items-center justify-between gap-4 px-6 py-4"
          >
            <div>
              <p className="text-sm font-medium text-slate-800">
                {movement.person}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {movement.action} ·{" "}
                <span className="font-medium text-slate-700">
                  {movement.element}
                </span>
              </p>
            </div>

            <span className="whitespace-nowrap text-xs text-slate-400">
              {movement.time}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RecentMovements;