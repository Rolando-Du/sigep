import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import healthRoutes from "./routes/health.routes.js";

const app = express();

const PORT = process.env.PORT || 4000;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Routes
app.use("/api/v1/health", healthRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: "Ruta no encontrada",
    },
  });
});

// Start server
app.listen(PORT, () => {
  console.log("");
  console.log("======================================");
  console.log(" SIGEP API");
  console.log("======================================");
  console.log(`Servidor: http://localhost:${PORT}`);
  console.log(`Health:   http://localhost:${PORT}/api/v1/health`);
  console.log("======================================");
  console.log("");
});
