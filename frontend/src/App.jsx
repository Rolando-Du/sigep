import { Route, Routes } from "react-router";

import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";

import Dashboard from "./pages/Dashboard";
import Personnel from "./pages/Personnel";
import Equipment from "./pages/Equipment";
import Assignments from "./pages/Assignments";
import Movements from "./pages/Movements";

function App() {
  return (
    <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar />

        <main className="min-w-0 flex-1">
          <Header />

          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/personal" element={<Personnel />} />
            <Route path="/equipamiento" element={<Equipment />} />
            <Route path="/asignaciones" element={<Assignments />} />
            <Route path="/movimientos" element={<Movements />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;