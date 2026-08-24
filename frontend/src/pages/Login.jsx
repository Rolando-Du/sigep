import { useState } from "react";
import { LockKeyhole, User } from "lucide-react";
import { useNavigate } from "react-router";

import {
  login,
} from "../services/auth.service";

const Login = () => {
  const navigate = useNavigate();

  const [username, setUsername] =
    useState("");
  const [password, setPassword] =
    useState("");
  const [error, setError] =
    useState("");
  const [isLoading, setIsLoading] =
    useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!username.trim() || !password) {
      setError(
        "Ingresá tu usuario y contraseña.",
      );
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      await login({
        username: username.trim(),
        password,
      });

      navigate("/");
    } catch (loginError) {
      setError(
        loginError.message ||
          "No se pudo iniciar sesión.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f6f8] px-4">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="bg-[#163b65] px-8 py-7 text-white">
            <p className="text-sm font-medium text-blue-100">
              Sistema Integral de Gestión
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              SIGEP
            </h1>

            <p className="mt-2 text-sm text-blue-100">
              Acceso al sistema
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="px-8 py-7"
          >
            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Usuario
              </label>

              <div className="relative">
                <User
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(event) =>
                    setUsername(
                      event.target.value,
                    )
                  }
                  placeholder="Ingresá tu usuario"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#7394b2] focus:ring-4 focus:ring-[#163b65]/5"
                />
              </div>
            </div>

            <div className="mt-5">
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Contraseña
              </label>

              <div className="relative">
                <LockKeyhole
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value,
                    )
                  }
                  placeholder="Ingresá tu contraseña"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#7394b2] focus:ring-4 focus:ring-[#163b65]/5"
                />
              </div>
            </div>

            {error && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-6 w-full rounded-xl bg-[#163b65] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#123252] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading
                ? "Ingresando..."
                : "Ingresar"}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          Acceso exclusivo para usuarios autorizados
        </p>
      </div>
    </div>
  );
};

export default Login;