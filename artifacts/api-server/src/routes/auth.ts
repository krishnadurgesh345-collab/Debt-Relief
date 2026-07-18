import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";

const router = Router();

const ACCESS_TOKEN_SECRET =
  process.env["ACCESS_TOKEN_SECRET"] || "debt-relief-access-secret-change-in-production";
const REFRESH_TOKEN_SECRET =
  process.env["REFRESH_TOKEN_SECRET"] || "debt-relief-refresh-secret-change-in-production";
const ACCESS_EXPIRES_IN = 60 * 60; // 1 hour in seconds
const REFRESH_EXPIRES_IN = "7d";

function generateTokens(userId: number, email: string) {
  const accessToken = jwt.sign({ userId, email }, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_EXPIRES_IN,
  });
  const refreshToken = jwt.sign({ userId, email }, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN,
  });
  return { accessToken, refreshToken, expiresIn: ACCESS_EXPIRES_IN };
}

function formatUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

// POST /api/auth/register
router.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body as {
      name?: string;
      email?: string;
      password?: string;
      phone?: string;
    };

    if (!name || name.trim().length < 2) {
      res.status(400).json({ error: "Name must be at least 2 characters" });
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: "Valid email is required" });
      return;
    }
    if (!password || password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }

    const [existing] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase()))
      .limit(1);

    if (existing) {
      res.status(409).json({ error: "An account with this email already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const [user] = await db
      .insert(usersTable)
      .values({
        name: name.trim(),
        email: email.toLowerCase(),
        hashedPassword,
        phone: phone?.trim() || null,
      })
      .returning();

    const tokens = generateTokens(user.id, user.email);

    res.status(201).json({ user: formatUser(user), tokens });
  } catch (err) {
    req.log.error({ err }, "Register failed");
    res.status(500).json({ error: "Registration failed" });
  }
});

// POST /api/auth/login
router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const valid = await bcrypt.compare(password, user.hashedPassword);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const tokens = generateTokens(user.id, user.email);
    res.json({ user: formatUser(user), tokens });
  } catch (err) {
    req.log.error({ err }, "Login failed");
    res.status(500).json({ error: "Login failed" });
  }
});

// GET /api/auth/me
router.get("/auth/me", authMiddleware, async (req, res) => {
  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.user!.id))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(formatUser(user));
  } catch (err) {
    req.log.error({ err }, "Get me failed");
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// POST /api/auth/refresh
router.post("/auth/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };

    if (!refreshToken) {
      res.status(400).json({ error: "Refresh token is required" });
      return;
    }

    let payload: { userId: number; email: string };
    try {
      payload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as {
        userId: number;
        email: string;
      };
    } catch {
      res.status(401).json({ error: "Invalid or expired refresh token" });
      return;
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, payload.userId))
      .limit(1);

    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    const tokens = generateTokens(user.id, user.email);
    res.json(tokens);
  } catch (err) {
    req.log.error({ err }, "Refresh token failed");
    res.status(500).json({ error: "Token refresh failed" });
  }
});

export default router;
