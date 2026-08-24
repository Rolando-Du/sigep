const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:4000";

const AUTH_URL = `${API_URL}/api/v1/auth`;

const TOKEN_KEY = "sigep_token";
const USER_KEY = "sigep_user";

const handleResponse = async (
  response,
  fallbackMessage,
) => {
  const result = await response.json();

  if (!response.ok) {
    const error = new Error(
      result?.error?.message ||
        fallbackMessage,
    );

    error.status = response.status;

    throw error;
  }

  return result.data;
};

const saveSession = ({
  token,
  user,
}) => {
  if (token) {
    localStorage.setItem(
      TOKEN_KEY,
      token,
    );
  }

  if (user) {
    localStorage.setItem(
      USER_KEY,
      JSON.stringify(user),
    );
  }
};

// LOGIN
export const login = async ({
  username,
  password,
}) => {
  const response = await fetch(
    `${AUTH_URL}/login`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    },
  );

  const data = await handleResponse(
    response,
    "No se pudo iniciar sesión",
  );

  saveSession(data);

  return data;
};

// TOKEN
export const getToken = () =>
  localStorage.getItem(TOKEN_KEY);

// USUARIO ACTUAL
export const getCurrentUser = () => {
  const user =
    localStorage.getItem(USER_KEY);

  if (!user) {
    return null;
  }

  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
};

// SESIÓN
export const isAuthenticated = () =>
  Boolean(getToken());

// OBTENER CUENTA
export const getMyAccount = async () => {
  const response = await fetch(
    `${AUTH_URL}/me`,
    {
      headers: {
        Authorization:
          `Bearer ${getToken()}`,
      },
    },
  );

  const data = await handleResponse(
    response,
    "No se pudo obtener la cuenta",
  );

  if (data.user) {
    localStorage.setItem(
      USER_KEY,
      JSON.stringify(data.user),
    );
  }

  return data;
};

// ACTUALIZAR CUENTA
export const updateMyAccount =
  async ({
    currentPassword,
    username,
    newPassword,
  }) => {
    const response = await fetch(
      `${AUTH_URL}/me`,
      {
        method: "PUT",
        headers: {
          Authorization:
            `Bearer ${getToken()}`,
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          username,
          newPassword:
            newPassword || undefined,
        }),
      },
    );

    const data = await handleResponse(
      response,
      "No se pudo actualizar la cuenta",
    );

    saveSession({
      token: data.token,
      user: data.user,
    });

    return data;
  };

// LOGOUT
export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};