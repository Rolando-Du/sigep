const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4000";

const PERSONNEL_URL = `${API_URL}/api/v1/personnel`;

const handleResponse = async (
  response,
  fallbackMessage,
) => {
  const result = await response.json();

  if (!response.ok) {
    const error = new Error(
      result?.error?.message || fallbackMessage,
    );

    error.status = response.status;
    error.details = result?.error?.details || [];

    throw error;
  }

  return result.data;
};

export const getPersonnel = async () => {
  const response = await fetch(PERSONNEL_URL);

  return handleResponse(
    response,
    "No se pudo obtener el personal",
  );
};

export const createPersonnel = async (personData) => {
  const response = await fetch(PERSONNEL_URL, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(personData),
  });

  return handleResponse(
    response,
    "No se pudo crear el personal",
  );
};

export const updatePersonnel = async (
  id,
  personData,
) => {
  const response = await fetch(
    `${PERSONNEL_URL}/${id}`,
    {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(personData),
    },
  );

  return handleResponse(
    response,
    "No se pudo actualizar el personal",
  );
};