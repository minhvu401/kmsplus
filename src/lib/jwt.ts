import jwt from "jsonwebtoken";
import { env } from "./env";

export function signToken(payload: object) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "2h" });
}

export function verifyToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET);
}
