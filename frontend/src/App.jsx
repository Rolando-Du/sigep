import {
  Navigate,
  Route,
  Routes,
} from "react-router";

import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";

import Dashboard from "./pages/Dashboard";
import Personnel from "./pages/Personnel";
import Equipment from "./pages/Equipment";
import Assignments from "./pages/Assignments";
import Movements from "./pages/Movements";
import Account from "./pages/Account";
import Login from "./pages/Login";

import {
  isAuthenticated,
} from "./services/auth.service";

// RUTA PROTEGIDA
const ProtectedApp = () => {
  if (!isAuthenticated()) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar />

        <main className="min-w-0 flex-1">
          <Header />

          <Routes>
            <Route
              path="/"
              element={<Dashboard />}
            />

            <Route
              path="/personal"
              element={<Personnel />}
            />

            <Route
              path="/equipamiento"
              element={<Equipment />}
            />

            <Route
              path="/asignaciones"
              element={<Assignments />}
            />

            <Route
              path="/movimientos"
              element={<Movements />}
            />

            <Route
              path="/cuenta"
              element={<Account />}
            />

            <Route
              path="*"
              element={
                <Navigate
                  to="/"
                  replace
                />
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated() ? (
            <Navigate
              to="/"
              replace
            />
          ) : (
            <Login />
          )
        }
      />

      <Route
        path="/*"
        element={<ProtectedApp />}
      />
    </Routes>
  );
}

export default App;