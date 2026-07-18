import { pgTable, serial, integer, numeric, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const settlementPredictionsTable = pgTable("settlement_predictions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  outstandingAmount: numeric("outstanding_amount", { precision: 12, scale: 2 }).notNull(),
  monthlyIncome: numeric("monthly_income", { precision: 12, scale: 2 }).notNull(),
  creditScore: integer("credit_score").notNull(),
  monthsOverdue: integer("months_overdue").notNull(),
  probability: numeric("probability", { precision: 5, scale: 2 }).notNull(),
  recommendedPercentage: numeric("recommended_percentage", { precision: 5, scale: 2 }).notNull(),
  estimatedPayment: numeric("estimated_payment", { precision: 12, scale: 2 }).notNull(),
  reasoning: text("reasoning").notNull(),
  nextSteps: jsonb("next_steps").notNull().$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPredictionSchema = createInsertSchema(settlementPredictionsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertPrediction = z.infer<typeof insertPredictionSchema>;
export type SettlementPredictionRecord = typeof settlementPredictionsTable.$inferSelect;
