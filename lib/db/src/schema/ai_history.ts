import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const aiHistoryTable = pgTable("ai_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  prompt: text("prompt").notNull(),
  response: text("response").notNull(),
  historyType: text("history_type").notNull().default("general"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAIHistorySchema = createInsertSchema(aiHistoryTable).omit({
  id: true,
  createdAt: true,
});

export type InsertAIHistory = z.infer<typeof insertAIHistorySchema>;
export type AIHistoryRecord = typeof aiHistoryTable.$inferSelect;
