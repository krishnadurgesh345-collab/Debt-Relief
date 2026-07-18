import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { settlementPredictionsTable } from "@workspace/db";
import { authMiddleware } from "../middleware/auth";
import { calculateSettlementProbability } from "../services/financial";
import { generateSettlementReasoning } from "../services/gemini";

const router = Router();
router.use(authMiddleware);

function toNum(val: string | number | null | undefined, def = 0): number {
  if (val === null || val === undefined) return def;
  return parseFloat(String(val)) || def;
}

// POST /api/settlement
router.post("/settlement", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { outstandingAmount, monthlyIncome, creditScore, monthsOverdue, disposableIncome, loanType } =
      req.body as {
        outstandingAmount?: number;
        monthlyIncome?: number;
        creditScore?: number;
        monthsOverdue?: number;
        disposableIncome?: number;
        loanType?: string;
      };

    if (typeof outstandingAmount !== "number" || outstandingAmount <= 0) {
      res.status(400).json({ error: "Valid outstanding amount is required" });
      return;
    }
    if (typeof monthlyIncome !== "number" || monthlyIncome < 0) {
      res.status(400).json({ error: "Valid monthly income is required" });
      return;
    }
    if (typeof creditScore !== "number" || creditScore < 300 || creditScore > 850) {
      res.status(400).json({ error: "Credit score must be between 300 and 850" });
      return;
    }
    if (typeof monthsOverdue !== "number" || monthsOverdue < 0) {
      res.status(400).json({ error: "Months overdue must be 0 or greater" });
      return;
    }

    const { probability, recommendedPercentage, estimatedPayment, nextSteps } =
      calculateSettlementProbability({
        outstandingAmount,
        monthlyIncome,
        creditScore,
        monthsOverdue,
        disposableIncome,
        loanType,
      });

    // Get AI-generated reasoning (or fallback)
    const reasoning = await generateSettlementReasoning({
      outstandingAmount,
      monthlyIncome,
      creditScore,
      monthsOverdue,
      probability,
      recommendedPercentage,
      estimatedPayment,
      loanType,
    });

    const [prediction] = await db
      .insert(settlementPredictionsTable)
      .values({
        userId,
        outstandingAmount: String(outstandingAmount),
        monthlyIncome: String(monthlyIncome),
        creditScore,
        monthsOverdue,
        probability: String(probability),
        recommendedPercentage: String(recommendedPercentage),
        estimatedPayment: String(estimatedPayment),
        reasoning,
        nextSteps,
      })
      .returning();

    res.json({
      id: prediction.id,
      probability: toNum(prediction.probability),
      recommendedPercentage: toNum(prediction.recommendedPercentage),
      estimatedPayment: toNum(prediction.estimatedPayment),
      reasoning: prediction.reasoning,
      nextSteps: Array.isArray(prediction.nextSteps) ? prediction.nextSteps : [],
      createdAt: prediction.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Settlement prediction failed");
    res.status(500).json({ error: "Failed to generate settlement prediction" });
  }
});

export default router;
