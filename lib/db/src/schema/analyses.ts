import { pgTable, serial, integer, numeric, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const financialAnalysesTable = pgTable("financial_analyses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  monthlyIncome: numeric("monthly_income", { precision: 12, scale: 2 }).notNull(),
  monthlyExpenses: numeric("monthly_expenses", { precision: 12, scale: 2 }).notNull(),
  monthlySavings: numeric("monthly_savings", { precision: 12, scale: 2 }).notNull(),
  financialScore: numeric("financial_score", { precision: 5, scale: 2 }).notNull(),
  debtRatio: numeric("debt_ratio", { precision: 5, scale: 2 }).notNull(),
  disposableIncome: numeric("disposable_income", { precision: 12, scale: 2 }).notNull(),
  totalMonthlyDebt: numeric("total_monthly_debt", { precision: 12, scale: 2 }).notNull(),
  riskLevel: text("risk_level").notNull(),
  recommendations: jsonb("recommendations").notNull().$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAnalysisSchema = createInsertSchema(financialAnalysesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type FinancialAnalysisRecord = typeof financialAnalysesTable.$inferSelect;
