import {
  ClipboardList,
  LayoutDashboard,
  PackageCheck,
  ShieldCheck,
  Users,
} from "lucide-react";

import { NavLink } from "react-router";

const menuItems = [
  {
    label: "Inicio",
    icon: LayoutDashboard,
    to: "/",
    end: true,
  },
  {
    label: "Personal",
    icon: Users,
    to: "/personal",
  },
  {
    label: "Equipamiento",
    icon: ShieldCheck,
    to: "/equipamiento",
  },
  {
    label: "Asignaciones",
    icon: PackageCheck,
    to: "/asignaciones",
  },
  {
    label: "Movimientos",
    icon: ClipboardList,
    to: "/movimientos",
  },
];

const Sidebar = () => {
  return (
    <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="border-b border-slate-100 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#163b65] text-white">
            <ShieldCheck size={21} strokeWidth={1.8} />
          </div>

          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">
              SIGEP
            </h1>

            <p className="text-[11px] leading-tight text-slate-500">
              Gestión de Equipamiento
              <br />
              y Personal
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5">
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
          Gestión
        </p>

        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-[#edf3f8] text-[#163b65]"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`
                }
              >
                <Icon size={19} strokeWidth={1.8} />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-slate-100 p-4">
        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-xs font-medium text-slate-700">
            Sistema interno
          </p>

          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
            Acceso exclusivo para personal autorizado.
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;