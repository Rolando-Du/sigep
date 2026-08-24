import { Router } from "express";

import {
  createPersonnel,
  getPersonnel,
  updatePersonnel,
} from "../controllers/personnel.controller.js";

const router = Router();

router.get("/", getPersonnel);
router.post("/", createPersonnel);
router.put("/:id", updatePersonnel);

export default router;