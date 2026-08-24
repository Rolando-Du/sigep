import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import personnelRoutes from "./routes/personnel.routes.js";
import equipmentTypeRoutes from "./routes/equipmentType.routes.js";
import equipmentRoutes from "./routes/equipment.routes.js";
import assignmentRoutes from "./routes/assignment.routes.js";

import {
  requireAuth,
} from "./middlewares/auth.middleware.js";

const app = express();

const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));

// RUTAS PÚBLICAS
app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/auth", authRoutes);

// AUTENTICACIÓN
app.use("/api/v1", requireAuth);

// RUTAS PRIVADAS
app.use("/api/v1/personnel", personnelRoutes);
app.use(
  "/api/v1/equipment-types",
  equipmentTypeRoutes,
);
app.use("/api/v1/equipment", equipmentRoutes);
app.use("/api/v1/assignments", assignmentRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: "Ruta no encontrada",
    },
  });
});

app.listen(PORT, () => {
  console.log("");
  console.log("======================================");
  console.log(" SIGEP API");
  console.log("======================================");
  console.log(
    `Servidor:  http://localhost:${PORT}`,
  );
  console.log(
    `Health:    http://localhost:${PORT}/api/v1/health`,
  );
  console.log(
    `Login:     http://localhost:${PORT}/api/v1/auth/login`,
  );
  console.log(
    `Personal:  http://localhost:${PORT}/api/v1/personnel`,
  );
  console.log(
    `Tipos equipo: http://localhost:${PORT}/api/v1/equipment-types`,
  );
  console.log("======================================");
  console.log("");
});