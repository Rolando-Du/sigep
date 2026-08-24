import { Router } from "express";

import {
  createEquipment,
  getEquipment,
  updateEquipment,
} from "../controllers/equipment.controller.js";

const router = Router();

router.get(
  "/",
  getEquipment,
);

router.post(
  "/",
  createEquipment,
);

router.put(
  "/:id",
  updateEquipment,
);

export default router;