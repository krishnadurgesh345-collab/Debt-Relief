import { Router } from "express";
import { db } from "@workspace/db";
import { aiHistoryTable } from "@workspace/db";
import { authMiddleware } from "../middleware/auth";
import { generateProfessionalLetter } from "../services/gemini";

const router = Router();
router.use(authMiddleware);

const VALID_LETTER_TYPES = ["settlement_request", "hardship_letter", "restructuring_request"] as const;
type LetterType = (typeof VALID_LETTER_TYPES)[number];

// POST /api/letter
router.post("/letter", async (req, res) => {
  try {
    const userId = req.user!.id;
    const { lenderName, amount, reason, letterType, additionalInfo } = req.body as {
      lenderName?: string;
      amount?: number;
      reason?: string;
      letterType?: string;
      additionalInfo?: string;
    };

    if (!lenderName?.trim()) {
      res.status(400).json({ error: "Lender name is required" });
      return;
    }
    if (typeof amount !== "number" || amount <= 0) {
      res.status(400).json({ error: "Valid amount is required" });
      return;
    }
    if (!reason || reason.trim().length < 10) {
      res.status(400).json({ error: "Reason must be at least 10 characters" });
      return;
    }
    if (!letterType || !VALID_LETTER_TYPES.includes(letterType as LetterType)) {
      res.status(400).json({
        error: "Letter type must be one of: settlement_request, hardship_letter, restructuring_request",
      });
      return;
    }

    const letter = await generateProfessionalLetter({
      lenderName: lenderName.trim(),
      amount,
      reason: reason.trim(),
      letterType: letterType as LetterType,
      additionalInfo: additionalInfo?.trim(),
      userName: req.user!.name,
    });

    const letterTypeLabels: Record<LetterType, string> = {
      settlement_request: "Debt Settlement Request",
      hardship_letter: "Financial Hardship Letter",
      restructuring_request: "Loan Restructuring Request",
    };

    const prompt = `Generate ${letterTypeLabels[letterType as LetterType]} for ${lenderName}: $${amount}, reason: ${reason}`;

    const [history] = await db
      .insert(aiHistoryTable)
      .values({
        userId,
        prompt,
        response: letter,
        historyType: "letter",
      })
      .returning();

    res.json({
      id: history.id,
      letter,
      letterType: letterType as LetterType,
      lenderName: lenderName.trim(),
      createdAt: history.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Letter generation failed");
    res.status(500).json({ error: "Failed to generate letter" });
  }
});

export default router;
