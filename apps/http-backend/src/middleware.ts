import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export function middleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers["authorization"] || "";
  const decode = jwt.verify(token, process.env.JWT_SECRET || "");

  if (decode) {
    next();
  } else {
    res.status(403).json({
      message: "Unauthorized",
    });
  }
}
