import { Router } from "express";
import { db } from "@workspace/db";
import { aiHistoryTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";

const router = Router();
router.use(authMiddleware);

// GET /api/history
router.get("/history", async (req, res) => {
  try {
    const userId = req.user!.id;
    const { page = "1", limit = "20" } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    const history = await db
      .select()
      .from(aiHistoryTable)
      .where(eq(aiHistoryTable.userId, userId))
      .orderBy(desc(aiHistoryTable.createdAt))
      .limit(limitNum)
      .offset(offset);

    res.json(
      history.map((h) => ({
        id: h.id,
        userId: h.userId,
        prompt: h.prompt,
        response: h.response,
        historyType: h.historyType,
        createdAt: h.createdAt.toISOString(),
      })),
    );
  } catch (err) {
    req.log.error({ err }, "Get history failed");
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

export default router;
