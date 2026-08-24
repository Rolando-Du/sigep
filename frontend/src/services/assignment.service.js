const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:4000";

const ASSIGNMENTS_URL =
  `${API_URL}/api/v1/assignments`;

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
    error.details =
      result?.error?.details || [];

    throw error;
  }

  return result.data;
};

// OBTENER ASIGNACIONES
export const getAssignments =
  async () => {
    const response = await fetch(
      ASSIGNMENTS_URL,
    );

    return handleResponse(
      response,
      "No se pudieron obtener las asignaciones",
    );
  };

// ASIGNACIONES DE PERSONAL
export const getPersonnelAssignments =
  async (personnelId) => {
    const response = await fetch(
      `${ASSIGNMENTS_URL}/personnel/${personnelId}`,
    );

    return handleResponse(
      response,
      "No se pudieron obtener las asignaciones del personal",
    );
  };

// CREAR ASIGNACIÓN
export const createAssignment =
  async (assignmentData) => {
    const response = await fetch(
      ASSIGNMENTS_URL,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify(
          assignmentData,
        ),
      },
    );

    return handleResponse(
      response,
      "No se pudo registrar la asignación",
    );
  };

// DEVOLUCIÓN DEFINITIVA
export const returnAssignmentDetail =
  async ({
    assignmentId,
    detailId,
    quantity,
  }) => {
    const response = await fetch(
      `${ASSIGNMENTS_URL}/${assignmentId}/details/${detailId}/return`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          quantity,
        }),
      },
    );

    return handleResponse(
      response,
      "No se pudo registrar la devolución",
    );
  };

// DEVOLUCIÓN DE PROVISIÓN DE PISTOLA
export const returnPistolProvision =
  async (assignmentId) => {
    const response = await fetch(
      `${ASSIGNMENTS_URL}/${assignmentId}/pistol-provision/return`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
      },
    );

    return handleResponse(
      response,
      "No se pudo devolver la provisión de pistola",
    );
  };