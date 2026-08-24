import { Router } from "express";

import {
  getMe,
  login,
  updateAccount,
} from "../controllers/auth.controller.js";

import {
  requireAuth,
} from "../middlewares/auth.middleware.js";

const router = Router();

// LOGIN
router.post("/login", login);

// CUENTA
router.get(
  "/me",
  requireAuth,
  getMe,
);

router.put(
  "/me",
  requireAuth,
  updateAccount,
);

export default router;