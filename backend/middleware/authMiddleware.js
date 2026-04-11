import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        message: "Not authorized, no token",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Not authorized, token failed",
      error: error.message,
    });
  }
};

export const hostOnly = (req, res, next) => {
  if (
    req.user &&
    (req.user.role === "host" ||
      req.user.role === "admin" ||
      req.user.role === "superadmin")
  ) {
    return next();
  }

  return res.status(403).json({
    message: "Host access only",
  });
};

export const adminOnly = (req, res, next) => {
  if (
    req.user &&
    (req.user.role === "admin" || req.user.role === "superadmin")
  ) {
    return next();
  }

  return res.status(403).json({
    message: "Admin access only",
  });
};

export const superAdminOnly = (req, res, next) => {
  if (req.user && req.user.role === "superadmin") {
    return next();
  }

  return res.status(403).json({
    message: "Superadmin access only",
  });
};

export default protect;