import {
  getToken,
} from "./auth.service";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:4000";

const EQUIPMENT_URL =
  `${API_URL}/api/v1/equipment`;

const getAuthHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
});

const handleResponse = async (
  response,
  fallbackMessage,
) => {
  const result =
    await response.json();

  if (!response.ok) {
    const error = new Error(
      result?.error?.message ||
        fallbackMessage,
    );

    error.status =
      response.status;

    error.details =
      result?.error?.details || [];

    throw error;
  }

  return result.data;
};

// OBTENER EQUIPAMIENTO
export const getEquipment =
  async () => {
    const response = await fetch(
      EQUIPMENT_URL,
      {
        headers: {
          ...getAuthHeaders(),
        },
      },
    );

    return handleResponse(
      response,
      "No se pudo obtener el equipamiento",
    );
  };

// CREAR EQUIPAMIENTO
export const createEquipment =
  async (equipmentData) => {
    const response = await fetch(
      EQUIPMENT_URL,
      {
        method: "POST",

        headers: {
          ...getAuthHeaders(),
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify(
          equipmentData,
        ),
      },
    );

    return handleResponse(
      response,
      "No se pudo registrar el equipamiento",
    );
  };

// ACTUALIZAR EQUIPAMIENTO
export const updateEquipment =
  async (
    equipmentId,
    equipmentData,
  ) => {
    const response = await fetch(
      `${EQUIPMENT_URL}/${equipmentId}`,
      {
        method: "PUT",

        headers: {
          ...getAuthHeaders(),
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify(
          equipmentData,
        ),
      },
    );

    return handleResponse(
      response,
      "No se pudo actualizar el equipamiento",
    );
  };