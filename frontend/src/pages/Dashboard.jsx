import {
  Boxes,
  PackageCheck,
  Search,
  Users,
} from "lucide-react";

import StatCard from "../components/dashboard/StatCard";
import RecentMovements from "../components/dashboard/RecentMovements";

const stats = [
  {
    label: "Personal registrado",
    value: "30",
    detail: "Personal activo",
    icon: Users,
  },
  {
    label: "Equipamiento asignado",
    value: "84",
    detail: "Elementos en uso",
    icon: PackageCheck,
  },
  {
    label: "Elementos disponibles",
    value: "12",
    detail: "Disponibles para asignar",
    icon: Boxes,
  },
];

const movements = [
  {
    person: "Juan Pérez",
    action: "Asignación de chaleco",
    element: "CH-018",
    time: "Hoy, 10:32",
  },
  {
    person: "Pedro Gómez",
    action: "Devolución de radio",
    element: "RAD-004",
    time: "Ayer, 15:17",
  },
  {
    person: "María González",
    action: "Asignación de equipamiento",
    element: "EQ-021",
    time: "18 ago, 11:45",
  },
];

const Dashboard = () => {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
      <div className="mb-8">
        <h3 className="text-2xl font-semibold tracking-tight text-slate-900">
          Panel general
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Información general de personal y equipamiento.
        </p>
      </div>

      <div className="mb-8">
        <div className="relative max-w-2xl">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="search"
            placeholder="Buscar persona, DNI, legajo o elemento..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#7394b2] focus:ring-4 focus:ring-[#163b65]/5"
          />
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            detail={stat.detail}
            icon={stat.icon}
          />
        ))}
      </section>

      <RecentMovements movements={movements} />
    </div>
  );
};

export default Dashboard;