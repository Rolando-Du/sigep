const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:4000";

const ASSIGNMENTS_URL =
  `${API_URL}/api/v1/assignments`;

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

/*
 * OBTENER TODAS LAS ASIGNACIONES
 *
 * Se utiliza en la pantalla general
 * de Asignaciones.
 */
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

/*
 * OBTENER ASIGNACIONES
 * DE UNA PERSONA
 */
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

/*
 * CREAR ASIGNACIÓN
 *
 * PERMANENT:
 * El equipamiento queda asignado
 * y permanece en poder del oficial.
 *
 * TEMPORARY:
 * El equipamiento queda asignado
 * al oficial y se considera
 * resguardado en Sala de Armas.
 */
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

/*
 * DEVOLUCIÓN DEFINITIVA
 *
 * El equipamiento deja de estar
 * asignado al personal y vuelve
 * al stock disponible.
 *
 * INDIVIDUAL:
 * normalmente devuelve 1 unidad.
 *
 * QUANTITY:
 * puede devolver una cantidad
 * parcial o total.
 */
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