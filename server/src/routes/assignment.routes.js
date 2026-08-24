import { Router } from "express";

import {
  createAssignment,
  getAssignments,
  getPersonnelAssignments,
  returnAssignmentDetail,
  returnPistolProvision,
} from "../controllers/assignment.controller.js";

const router = Router();

// LISTADO GENERAL
router.get(
  "/",
  getAssignments,
);

// CREAR ASIGNACIÓN
router.post(
  "/",
  createAssignment,
);

// ASIGNACIONES DE PERSONAL
router.get(
  "/personnel/:personnelId",
  getPersonnelAssignments,
);

// DEVOLUCIÓN DE PROVISIÓN DE PISTOLA
router.post(
  "/:assignmentId/pistol-provision/return",
  returnPistolProvision,
);

// DEVOLUCIÓN DEFINITIVA
router.post(
  "/:assignmentId/details/:detailId/return",
  returnAssignmentDetail,
);

export default router;