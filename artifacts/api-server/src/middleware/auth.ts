import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const ACCESS_TOKEN_SECRET =
  process.env["ACCESS_TOKEN_SECRET"] || "debt-relief-access-secret-change-in-production";

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authorization token required" });
    return;
  }

  const token = authHeader.split(" ")[1];

  let payload: { userId: number; email: string };

  try {
    payload = jwt.verify(token, ACCESS_TOKEN_SECRET) as { userId: number; email: string };
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  db.select()
    .from(usersTable)
    .where(eq(usersTable.id, payload.userId))
    .limit(1)
    .then(([user]) => {
      if (!user) {
        res.status(401).json({ error: "User not found" });
        return;
      }
      req.user = { id: user.id, email: user.email, name: user.name };
      next();
    })
    .catch(() => {
      res.status(500).json({ error: "Authentication error" });
    });
}
