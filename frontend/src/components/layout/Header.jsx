import {
  LogOut,
  UserRound,
} from "lucide-react";

import {
  useLocation,
  useNavigate,
} from "react-router";

import {
  getCurrentUser,
  logout,
} from "../../services/auth.service";

const titles = {
  "/": "Inicio",
  "/personal": "Personal",
  "/equipamiento": "Equipamiento",
  "/asignaciones": "Asignaciones",
  "/movimientos": "Movimientos",
  "/cuenta": "Mi cuenta",
};

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const user = getCurrentUser();

  const currentTitle =
    titles[location.pathname] || "SIGEP";

  const handleAccount = () => {
    navigate("/cuenta");
  };

  const handleLogout = () => {
    logout();
    window.location.replace("/login");
  };

  const initials = user?.username
    ? user.username
        .slice(0, 2)
        .toUpperCase()
    : "AD";

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
              {user?.username ||
                "Administrador"}
            </p>

            <p className="text-xs text-slate-500">
              {user?.role === "ADMIN"
                ? "Administrador"
                : "Usuario del sistema"}
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#163b65] text-sm font-semibold text-white">
            {initials}
          </div>

          <button
            type="button"
            onClick={handleAccount}
            className="ml-1 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:border-[#7394b2] hover:bg-[#edf3f8] hover:text-[#163b65]"
            title="Mi cuenta"
          >
            <UserRound size={17} />

            <span className="hidden lg:inline">
              Mi cuenta
            </span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            title="Cerrar sesión"
          >
            <LogOut size={17} />

            <span className="hidden lg:inline">
              Cerrar sesión
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;