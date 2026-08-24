const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:4000";

const EQUIPMENT_TYPES_URL =
  `${API_URL}/api/v1/equipment-types`;

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
      result?.error?.details ||
      [];

    throw error;
  }

  return result.data;
};

export const getEquipmentTypes =
  async () => {
    const response =
      await fetch(
        EQUIPMENT_TYPES_URL,
      );

    return handleResponse(
      response,
      "No se pudieron obtener los tipos de equipamiento",
    );
  };

export const createEquipmentType =
  async (
    equipmentTypeData,
  ) => {
    const response =
      await fetch(
        EQUIPMENT_TYPES_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            equipmentTypeData,
          ),
        },
      );

    return handleResponse(
      response,
      "No se pudo crear el tipo de equipamiento",
    );
  };