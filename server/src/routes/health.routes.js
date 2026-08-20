import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      service: "SIGEP API",
      status: "operational",
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
