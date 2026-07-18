import { Router } from "express";
import { db } from "@workspace/db";
import { financialAnalysesTable, loansTable } from "@workspace/db";
import { eq, desc, inArray } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";
import {
  calculateDebtToIncomeRatio,
  calculateFinancialScore,
  getRiskLevel,
} from "../services/financial";
import { generateFinancialRecommendations } from "../services/gemini";

const router = Router();
router.use(authMiddleware);

function toNum(val: string | number | null | undefined, def = 0): number {
  if (val === null || val === undefined) return def;
  return parseFloat(String(val)) || def;
}

function formatAnalysis(a: typeof financialAnalysesTable.$inferSelect) {
  return {
    id: a.id,
    userId: a.userId,
    monthlyIncome: toNum(a.monthlyIncome),
    monthlyExpenses: toNum(a.monthlyExpenses),
    monthlySavings: toNum(a.monthlySavings),
    financialScore: toNum(a.financialScore),
    debtRatio: toNum(a.debtRatio),
    riskLevel: a.riskLevel,
    recommendations: Array.isArray(a.recommendations) ? a.recommendations : [],
    disposableIncome: toNum(a.disposableIncome),
    totalMonthlyDebt: toNum(a.totalMonthlyDebt),
    createdAt: a.createdAt.toISOString(),
  };
}

// GET /api/analysis
router.get("/analysis", async (req, res) => {
  try {
    const userId = req.user!.id;
    const analyses = await db
      .select()
      .from(financialAnalysesTable)
      .where(eq(financialAnalysesTable.userId, userId))
      .orderBy(desc(financialAnalysesTable.createdAt))
      .limit(50);

    res.json(analyses.map(formatAnalysis));
  } catch (err) {
    req.log.error({ err }, "Get analyses failed");
    res.status(500).json({ error: "Failed to fetch analyses" });
  }
});

// POST /api/analysis
router.post("/analysis", async (req, res) => {
  try {
    const userId = req.user!.id;
    const { monthlyIncome, monthlyExpenses, monthlySavings, loanIds } = req.body as {
      monthlyIncome?: number;
      monthlyExpenses?: number;
      monthlySavings?: number;
      loanIds?: number[];
    };

    if (typeof monthlyIncome !== "number" || monthlyIncome < 0) {
      res.status(400).json({ error: "Valid monthly income is required" });
      return;
    }
    if (typeof monthlyExpenses !== "number" || monthlyExpenses < 0) {
      res.status(400).json({ error: "Valid monthly expenses are required" });
      return;
    }
    if (typeof monthlySavings !== "number" || monthlySavings < 0) {
      res.status(400).json({ error: "Valid monthly savings are required" });
      return;
    }

    // Fetch loans to calculate total monthly debt
    let userLoans;
    if (loanIds && loanIds.length > 0) {
      userLoans = await db
        .select()
        .from(loansTable)
        .where(inArray(loansTable.id, loanIds));
      // Filter to only this user's loans
      userLoans = userLoans.filter((l) => l.userId === userId);
    } else {
      userLoans = await db
        .select()
        .from(loansTable)
        .where(eq(loansTable.userId, userId));
    }

    const activeLoans = userLoans.filter((l) => l.status !== "settled");
    const totalMonthlyDebt = activeLoans.reduce(
      (sum, l) => sum + toNum(l.monthlyPayment),
      0,
    );

    const disposableIncome = monthlyIncome - monthlyExpenses - totalMonthlyDebt;
    const debtRatio = calculateDebtToIncomeRatio(totalMonthlyDebt, monthlyIncome);
    const financialScore = calculateFinancialScore({
      monthlyIncome,
      monthlyExpenses,
      monthlySavings,
      totalMonthlyDebt,
    });
    const riskLevel = getRiskLevel(financialScore);

    // Get AI recommendations (Gemini or fallback)
    const recommendations = await generateFinancialRecommendations({
      monthlyIncome,
      monthlyExpenses,
      monthlySavings,
      debtRatio,
      financialScore,
      riskLevel,
      disposableIncome,
      totalMonthlyDebt,
    });

    const [analysis] = await db
      .insert(financialAnalysesTable)
      .values({
        userId,
        monthlyIncome: String(monthlyIncome),
        monthlyExpenses: String(monthlyExpenses),
        monthlySavings: String(monthlySavings),
        financialScore: String(financialScore),
        debtRatio: String(debtRatio),
        disposableIncome: String(Math.round(disposableIncome * 100) / 100),
        totalMonthlyDebt: String(Math.round(totalMonthlyDebt * 100) / 100),
        riskLevel,
        recommendations,
      })
      .returning();

    res.json(formatAnalysis(analysis));
  } catch (err) {
    req.log.error({ err }, "Create analysis failed");
    res.status(500).json({ error: "Failed to perform analysis" });
  }
});

export default router;
