import type{ Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

interface JwtPayload {
  id: string;
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required"
      });
    }

    const token = header.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as JwtPayload;

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "User not found"
      });
    }

    req.user = user;

    next();
  } catch {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
};


export const adminOnly = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      message: "Admin access required"
    });
  }

  next();
};