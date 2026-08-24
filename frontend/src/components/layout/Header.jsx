import { useLocation } from "react-router";

const titles = {
  "/": "Inicio",
  "/personal": "Personal",
  "/equipamiento": "Equipamiento",
  "/asignaciones": "Asignaciones",
  "/movimientos": "Movimientos",
};

const Header = () => {
  const location = useLocation();

  const currentTitle = titles[location.pathname] || "SIGEP";

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="flex h-20 items-center justify-between px-6 lg:px-10">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
            Sistema Integral
          </p>

          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
            {currentTitle}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-slate-800">
              Administrador
            </p>

            <p className="text-xs text-slate-500">
              Usuario del sistema
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#163b65] text-sm font-semibold text-white">
            AD
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;