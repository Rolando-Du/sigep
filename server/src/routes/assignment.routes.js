import { Router } from "express";

import {
  createAssignment,
  getAssignments,
  getPersonnelAssignments,
  returnAssignmentDetail,
} from "../controllers/assignment.controller.js";

const router = Router();

/*
 * LISTADO GENERAL DE ASIGNACIONES
 */
router.get(
  "/",
  getAssignments,
);

/*
 * CREAR ASIGNACIÓN
 */
router.post(
  "/",
  createAssignment,
);

/*
 * ASIGNACIONES DE UNA PERSONA
 */
router.get(
  "/personnel/:personnelId",
  getPersonnelAssignments,
);

/*
 * DEVOLUCIÓN DEFINITIVA
 *
 * El equipamiento deja de estar
 * asignado al personal y vuelve
 * al stock disponible.
 */
router.post(
  "/:assignmentId/details/:detailId/return",
  returnAssignmentDetail,
);

export default router;