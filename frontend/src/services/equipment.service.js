const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:4000";

const EQUIPMENT_URL =
  `${API_URL}/api/v1/equipment`;

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

export const getEquipment =
  async () => {
    const response = await fetch(
      EQUIPMENT_URL,
    );

    return handleResponse(
      response,
      "No se pudo obtener el equipamiento",
    );
  };

export const createEquipment =
  async (equipmentData) => {
    const response = await fetch(
      EQUIPMENT_URL,
      {
        method: "POST",

        headers: {
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

/*
 * Actualizar equipamiento existente.
 */
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