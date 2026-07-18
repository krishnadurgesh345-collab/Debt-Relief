import { Router } from "express";
import { db } from "@workspace/db";
import { loansTable, financialAnalysesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";

const router = Router();
router.use(authMiddleware);

function toNum(val: string | number | null | undefined, def = 0): number {
  if (val === null || val === undefined) return def;
  return parseFloat(String(val)) || def;
}

function formatLoan(loan: typeof loansTable.$inferSelect) {
  return {
    id: loan.id,
    userId: loan.userId,
    lenderName: loan.lenderName,
    loanType: loan.loanType,
    loanAmount: toNum(loan.loanAmount),
    remainingAmount: toNum(loan.remainingAmount),
    interestRate: toNum(loan.interestRate),
    monthlyPayment: toNum(loan.monthlyPayment),
    monthsOverdue: loan.monthsOverdue,
    status: loan.status,
    createdAt: loan.createdAt.toISOString(),
    updatedAt: loan.updatedAt.toISOString(),
  };
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

// GET /api/dashboard
router.get("/dashboard", async (req, res) => {
  try {
    const userId = req.user!.id;

    // Parallel fetch
    const [allLoans, recentAnalyses] = await Promise.all([
      db.select().from(loansTable).where(eq(loansTable.userId, userId)).orderBy(desc(loansTable.createdAt)),
      db
        .select()
        .from(financialAnalysesTable)
        .where(eq(financialAnalysesTable.userId, userId))
        .orderBy(desc(financialAnalysesTable.createdAt))
        .limit(5),
    ]);

    const recentLoans = allLoans.slice(0, 5);
    const totalDebt = allLoans.reduce((s, l) => s + toNum(l.remainingAmount), 0);
    const totalMonthlyPayment = allLoans.reduce((s, l) => s + toNum(l.monthlyPayment), 0);
    const loanCount = allLoans.length;

    const loansByStatus = {
      active: allLoans.filter((l) => l.status === "active").length,
      settled: allLoans.filter((l) => l.status === "settled").length,
      defaulted: allLoans.filter((l) => l.status === "defaulted").length,
      negotiating: allLoans.filter((l) => l.status === "negotiating").length,
    };

    // Latest analysis metrics
    const latestAnalysis = recentAnalyses[0];
    const monthlyIncome = latestAnalysis ? toNum(latestAnalysis.monthlyIncome) : null;
    const monthlyExpenses = latestAnalysis ? toNum(latestAnalysis.monthlyExpenses) : null;
    const financialScore = latestAnalysis ? toNum(latestAnalysis.financialScore) : null;
    const debtRatio = latestAnalysis ? toNum(latestAnalysis.debtRatio) : null;

    // Estimate settlement probability from financial score
    const settlementProbability = financialScore !== null ? Math.max(5, 100 - financialScore) : null;

    // Generate monthly trend (last 6 months based on loan data)
    const now = new Date();
    const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const month = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      // Simple projection — remaining debt decreases by monthly payments each month
      const monthsAgo = 5 - i;
      const projectedDebt = Math.max(
        0,
        totalDebt + totalMonthlyPayment * monthsAgo,
      );
      return {
        month,
        totalDebt: Math.round(projectedDebt * 100) / 100,
        payments: Math.round(totalMonthlyPayment * 100) / 100,
      };
    });

    res.json({
      totalDebt: Math.round(totalDebt * 100) / 100,
      monthlyIncome,
      monthlyExpenses,
      financialScore,
      debtRatio,
      settlementProbability,
      loanCount,
      totalMonthlyPayment: Math.round(totalMonthlyPayment * 100) / 100,
      recentLoans: recentLoans.map(formatLoan),
      recentAnalyses: recentAnalyses.map(formatAnalysis),
      loansByStatus,
      monthlyTrend,
    });
  } catch (err) {
    req.log.error({ err }, "Dashboard fetch failed");
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

export default router;
