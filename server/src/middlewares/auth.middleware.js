// AUTENTICACIÓN
import jwt from "jsonwebtoken";

// PROTEGER RUTAS
export const requireAuth = (
  req,
  res,
  next,
) => {
  const authorization =
    req.headers.authorization;

  if (
    !authorization ||
    !authorization.startsWith("Bearer ")
  ) {
    return res.status(401).json({
      success: false,
      error: {
        message: "Autenticación requerida",
      },
    });
  }

  const token = authorization.slice(7);

  try {
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error(
        "JWT_SECRET no está configurada",
      );
    }

    const payload = jwt.verify(
      token,
      jwtSecret,
    );

    req.user = {
      id: Number(payload.sub),
      username: payload.username,
      role: payload.role,
    };

    next();
  } catch {
    return res.status(401).json({
      success: false,
      error: {
        message:
          "Token inválido o vencido",
      },
    });
  }
};