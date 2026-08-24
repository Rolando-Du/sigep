import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import prisma from "../lib/prisma.js";

const createToken = (user) => {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error(
      "JWT_SECRET no está configurada",
    );
  }

  return jwt.sign(
    {
      sub: String(user.id),
      username: user.username,
      role: user.role,
    },
    jwtSecret,
    {
      expiresIn:
        process.env.JWT_EXPIRES_IN || "8h",
    },
  );
};

const getPublicUser = (user) => ({
  id: user.id,
  username: user.username,
  role: user.role,
});

// LOGIN
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: {
          message:
            "Usuario y contraseña son obligatorios",
        },
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        username: username.trim(),
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          message:
            "Usuario o contraseña incorrectos",
        },
      });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.passwordHash,
    );

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: {
          message:
            "Usuario o contraseña incorrectos",
        },
      });
    }

    const token = createToken(user);

    return res.status(200).json({
      success: true,
      data: {
        token,
        user: getPublicUser(user),
      },
    });
  } catch (error) {
    console.error("Error en login:", error);

    return res.status(500).json({
      success: false,
      error: {
        message:
          "No se pudo iniciar sesión",
      },
    });
  }
};

// USUARIO ACTUAL
export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
    });

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        error: {
          message: "Usuario no encontrado",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: getPublicUser(user),
      },
    });
  } catch (error) {
    console.error(
      "Error obteniendo usuario:",
      error,
    );

    return res.status(500).json({
      success: false,
      error: {
        message:
          "No se pudo obtener la cuenta",
      },
    });
  }
};

// ACTUALIZAR CUENTA
export const updateAccount = async (
  req,
  res,
) => {
  try {
    const {
      currentPassword,
      username,
      newPassword,
    } = req.body;

    if (!currentPassword) {
      return res.status(400).json({
        success: false,
        error: {
          message:
            "La contraseña actual es obligatoria",
        },
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
    });

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        error: {
          message: "Usuario no encontrado",
        },
      });
    }

    const validPassword = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: {
          message:
            "La contraseña actual es incorrecta",
        },
      });
    }

    const nextUsername =
      username?.trim() || user.username;

    if (nextUsername.length < 3) {
      return res.status(400).json({
        success: false,
        error: {
          message:
            "El nombre de usuario debe tener al menos 3 caracteres",
        },
      });
    }

    if (
      newPassword &&
      newPassword.length < 8
    ) {
      return res.status(400).json({
        success: false,
        error: {
          message:
            "La nueva contraseña debe tener al menos 8 caracteres",
        },
      });
    }

    const usernameExists =
      await prisma.user.findUnique({
        where: {
          username: nextUsername,
        },
      });

    if (
      usernameExists &&
      usernameExists.id !== user.id
    ) {
      return res.status(409).json({
        success: false,
        error: {
          message:
            "El nombre de usuario ya está en uso",
        },
      });
    }

    const data = {
      username: nextUsername,
    };

    if (newPassword) {
      data.passwordHash = await bcrypt.hash(
        newPassword,
        12,
      );
    }

    const updatedUser =
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data,
      });

    const passwordChanged =
      Boolean(newPassword);

    const token = createToken(updatedUser);

    return res.status(200).json({
      success: true,
      data: {
        user: getPublicUser(updatedUser),
        token,
        passwordChanged,
      },
    });
  } catch (error) {
    console.error(
      "Error actualizando cuenta:",
      error,
    );

    return res.status(500).json({
      success: false,
      error: {
        message:
          "No se pudo actualizar la cuenta",
      },
    });
  }
};