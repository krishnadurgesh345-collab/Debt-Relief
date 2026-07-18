import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { loansTable } from "@workspace/db";
import { eq, and, ilike, desc, asc, sql } from "drizzle-orm";
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

// GET /api/loans/summary — must be before /:id
router.get("/loans/summary", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const loans = await db.select().from(loansTable).where(eq(loansTable.userId, userId));

    const totalLoans = loans.length;
    const totalDebt = loans.reduce((s, l) => s + toNum(l.remainingAmount), 0);
    const totalMonthlyPayment = loans.reduce((s, l) => s + toNum(l.monthlyPayment), 0);
    const activeLoans = loans.filter((l) => l.status === "active").length;
    const settledLoans = loans.filter((l) => l.status === "settled").length;
    const defaultedLoans = loans.filter((l) => l.status === "defaulted").length;
    const negotiatingLoans = loans.filter((l) => l.status === "negotiating").length;
    const avgRate =
      totalLoans > 0
        ? loans.reduce((s, l) => s + toNum(l.interestRate), 0) / totalLoans
        : 0;

    res.json({
      totalLoans,
      totalDebt: Math.round(totalDebt * 100) / 100,
      totalMonthlyPayment: Math.round(totalMonthlyPayment * 100) / 100,
      activeLoans,
      settledLoans,
      defaultedLoans,
      negotiatingLoans,
      averageInterestRate: Math.round(avgRate * 100) / 100,
    });
  } catch (err) {
    req.log.error({ err }, "Get loans summary failed");
    res.status(500).json({ error: "Failed to fetch loan summary" });
  }
});

// GET /api/loans
router.get("/loans", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { status, search, page = "1", limit = "10", sortBy = "createdAt", sortOrder = "desc" } =
      req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [eq(loansTable.userId, userId)];
    if (status) conditions.push(eq(loansTable.status, status));
    if (search) conditions.push(ilike(loansTable.lenderName, `%${search}%`));

    const whereClause = and(...conditions);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(loansTable)
      .where(whereClause);

    const validSortCols: Record<string, typeof loansTable.createdAt> = {
      createdAt: loansTable.createdAt,
      loanAmount: loansTable.loanAmount as unknown as typeof loansTable.createdAt,
      remainingAmount: loansTable.remainingAmount as unknown as typeof loansTable.createdAt,
      monthlyPayment: loansTable.monthlyPayment as unknown as typeof loansTable.createdAt,
      monthsOverdue: loansTable.monthsOverdue as unknown as typeof loansTable.createdAt,
      lenderName: loansTable.lenderName as unknown as typeof loansTable.createdAt,
    };

    const sortCol = validSortCols[sortBy] ?? loansTable.createdAt;
    const orderFn = sortOrder === "asc" ? asc : desc;

    const loans = await db
      .select()
      .from(loansTable)
      .where(whereClause)
      .orderBy(orderFn(sortCol))
      .limit(limitNum)
      .offset(offset);

    res.json({
      loans: loans.map(formatLoan),
      total: count,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(count / limitNum),
    });
  } catch (err) {
    req.log.error({ err }, "Get loans failed");
    res.status(500).json({ error: "Failed to fetch loans" });
  }
});

// POST /api/loans
router.post("/loans", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      lenderName,
      loanType,
      loanAmount,
      remainingAmount,
      interestRate,
      monthlyPayment,
      monthsOverdue,
      status,
    } = req.body as {
      lenderName?: string;
      loanType?: string;
      loanAmount?: number;
      remainingAmount?: number;
      interestRate?: number;
      monthlyPayment?: number;
      monthsOverdue?: number;
      status?: string;
    };

    if (!lenderName?.trim()) {
      res.status(400).json({ error: "Lender name is required" });
      return;
    }
    if (!loanType?.trim()) {
      res.status(400).json({ error: "Loan type is required" });
      return;
    }
    if (typeof loanAmount !== "number" || loanAmount < 0) {
      res.status(400).json({ error: "Valid loan amount is required" });
      return;
    }
    if (typeof remainingAmount !== "number" || remainingAmount < 0) {
      res.status(400).json({ error: "Valid remaining amount is required" });
      return;
    }

    const validStatuses = ["active", "settled", "defaulted", "negotiating"];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ error: "Status must be one of: active, settled, defaulted, negotiating" });
      return;
    }

    const [loan] = await db
      .insert(loansTable)
      .values({
        userId,
        lenderName: lenderName.trim(),
        loanType: loanType.trim(),
        loanAmount: String(loanAmount),
        remainingAmount: String(remainingAmount),
        interestRate: String(interestRate ?? 0),
        monthlyPayment: String(monthlyPayment ?? 0),
        monthsOverdue: monthsOverdue ?? 0,
        status,
      })
      .returning();

    res.status(201).json(formatLoan(loan));
  } catch (err) {
    req.log.error({ err }, "Create loan failed");
    res.status(500).json({ error: "Failed to create loan" });
  }
});

// PUT /api/loans/:id
router.put("/loans/:id", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const loanId = parseInt(req.params["id"] as string);

    if (isNaN(loanId)) {
      res.status(400).json({ error: "Invalid loan ID" });
      return;
    }

    const [existing] = await db
      .select()
      .from(loansTable)
      .where(and(eq(loansTable.id, loanId), eq(loansTable.userId, userId)))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Loan not found" });
      return;
    }

    const {
      lenderName,
      loanType,
      loanAmount,
      remainingAmount,
      interestRate,
      monthlyPayment,
      monthsOverdue,
      status,
    } = req.body as Partial<{
      lenderName: string;
      loanType: string;
      loanAmount: number;
      remainingAmount: number;
      interestRate: number;
      monthlyPayment: number;
      monthsOverdue: number;
      status: string;
    }>;

    const validStatuses = ["active", "settled", "defaulted", "negotiating"];
    if (status && !validStatuses.includes(status)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }

    const updateData: Partial<typeof loansTable.$inferInsert> & { updatedAt: Date } = {
      updatedAt: new Date(),
    };

    if (lenderName !== undefined) updateData.lenderName = lenderName.trim();
    if (loanType !== undefined) updateData.loanType = loanType.trim();
    if (loanAmount !== undefined) updateData.loanAmount = String(loanAmount);
    if (remainingAmount !== undefined) updateData.remainingAmount = String(remainingAmount);
    if (interestRate !== undefined) updateData.interestRate = String(interestRate);
    if (monthlyPayment !== undefined) updateData.monthlyPayment = String(monthlyPayment);
    if (monthsOverdue !== undefined) updateData.monthsOverdue = monthsOverdue;
    if (status !== undefined) updateData.status = status;

    const [updated] = await db
      .update(loansTable)
      .set(updateData)
      .where(and(eq(loansTable.id, loanId), eq(loansTable.userId, userId)))
      .returning();

    res.json(formatLoan(updated));
  } catch (err) {
    req.log.error({ err }, "Update loan failed");
    res.status(500).json({ error: "Failed to update loan" });
  }
});

// DELETE /api/loans/:id
router.delete("/loans/:id", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const loanId = parseInt(req.params["id"] as string);

    if (isNaN(loanId)) {
      res.status(400).json({ error: "Invalid loan ID" });
      return;
    }

    const [existing] = await db
      .select()
      .from(loansTable)
      .where(and(eq(loansTable.id, loanId), eq(loansTable.userId, userId)))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Loan not found" });
      return;
    }

    await db
      .delete(loansTable)
      .where(and(eq(loansTable.id, loanId), eq(loansTable.userId, userId)));

    res.json({ message: "Loan deleted successfully" });
  } catch (err) {
    req.log.error({ err }, "Delete loan failed");
    res.status(500).json({ error: "Failed to delete loan" });
  }
});

export default router;
