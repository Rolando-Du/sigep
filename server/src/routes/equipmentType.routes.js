import { Router } from "express";

import {
  createEquipmentType,
  getEquipmentTypes,
} from "../controllers/equipmentType.controller.js";

const router = Router();

router.get("/", getEquipmentTypes);
router.post("/", createEquipmentType);

export default router;