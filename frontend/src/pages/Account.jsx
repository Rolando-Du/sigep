// MI CUENTA
import {
  useEffect,
  useState,
} from "react";

import {
  LockKeyhole,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import Swal from "sweetalert2";

import {
  getCurrentUser,
  getMyAccount,
  logout,
  updateMyAccount,
} from "../services/auth.service";

const inputClasses =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#7394b2] focus:ring-4 focus:ring-[#163b65]/5";

const Account = () => {
  const currentUser = getCurrentUser();

  const [username, setUsername] =
    useState(currentUser?.username || "");

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadAccount = async () => {
      try {
        setIsLoading(true);

        const data = await getMyAccount();

        setUsername(
          data.user?.username || "",
        );
      } catch (loadError) {
        setError(
          loadError.message ||
            "No se pudo cargar la cuenta",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadAccount();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!username.trim()) {
      setError(
        "El nombre de usuario es obligatorio.",
      );
      return;
    }

    if (username.trim().length < 3) {
      setError(
        "El nombre de usuario debe tener al menos 3 caracteres.",
      );
      return;
    }

    if (!currentPassword) {
      setError(
        "Ingresá tu contraseña actual para confirmar los cambios.",
      );
      return;
    }

    if (
      newPassword &&
      newPassword.length < 8
    ) {
      setError(
        "La nueva contraseña debe tener al menos 8 caracteres.",
      );
      return;
    }

    if (
      newPassword !== confirmPassword
    ) {
      setError(
        "Las nuevas contraseñas no coinciden.",
      );
      return;
    }

    try {
      setIsSaving(true);
      setError("");

      const data = await updateMyAccount({
        currentPassword,
        username: username.trim(),
        newPassword,
      });

      if (data.passwordChanged) {
        await Swal.fire({
          icon: "success",
          title: "Contraseña actualizada",
          text: "Por seguridad, iniciá sesión nuevamente.",
          confirmButtonText: "Aceptar",
        });

        logout();

        window.location.replace(
          "/login",
        );

        return;
      }

      await Swal.fire({
        icon: "success",
        title: "Cuenta actualizada",
        text: "El nombre de usuario se actualizó correctamente.",
        confirmButtonText: "Aceptar",
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      window.location.reload();
    } catch (saveError) {
      setError(
        saveError.message ||
          "No se pudo actualizar la cuenta.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        <p className="text-sm text-slate-500">
          Cargando cuenta...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
      <div>
        <div className="flex items-center gap-2">
          <UserRound
            size={24}
            className="text-[#163b65]"
          />

          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Mi cuenta
          </h1>
        </div>

        <p className="mt-2 text-sm text-slate-500">
          Administrá tus credenciales de acceso a SIGEP.
        </p>
      </div>

      <div className="mt-6 max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf3f8] text-[#163b65]">
              <ShieldCheck size={21} />
            </div>

            <div>
              <p className="font-semibold text-slate-900">
                Administrador
              </p>

              <p className="text-sm text-slate-500">
                Configuración de acceso
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="px-6 py-6"
        >
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="accountUsername"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Nombre de usuario
            </label>

            <div className="relative">
              <UserRound
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                id="accountUsername"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(event) =>
                  setUsername(
                    event.target.value,
                  )
                }
                className={`${inputClasses} pl-11`}
              />
            </div>
          </div>

          <div className="mt-7 border-t border-slate-100 pt-6">
            <h2 className="text-sm font-semibold text-slate-800">
              Seguridad
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              La contraseña actual es obligatoria para guardar cualquier cambio.
            </p>
          </div>

          <div className="mt-5">
            <label
              htmlFor="currentPassword"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Contraseña actual *
            </label>

            <div className="relative">
              <LockKeyhole
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) =>
                  setCurrentPassword(
                    event.target.value,
                  )
                }
                placeholder="Ingresá tu contraseña actual"
                className={`${inputClasses} pl-11`}
              />
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="newPassword"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Nueva contraseña
              </label>

              <input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) =>
                  setNewPassword(
                    event.target.value,
                  )
                }
                placeholder="Mínimo 8 caracteres"
                className={inputClasses}
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Repetir contraseña
              </label>

              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value,
                  )
                }
                placeholder="Repetí la contraseña"
                className={inputClasses}
              />
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-400">
            Si no querés cambiar la contraseña, dejá ambos campos de nueva contraseña vacíos.
          </p>

          <div className="mt-7 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-[#163b65] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#123252] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={17} />

              {isSaving
                ? "Guardando..."
                : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Account;