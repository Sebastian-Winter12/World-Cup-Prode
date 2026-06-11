import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const matchesTable = pgTable("matches", {
  id: serial("id").primaryKey(),
  apiId: integer("api_id"),
  homeTeam: text("home_team").notNull(),
  awayTeam: text("away_team").notNull(),
  homeFlag: text("home_flag"),
  awayFlag: text("away_flag"),
  matchDate: timestamp("match_date", { withTimezone: true }).notNull(),
  stadium: text("stadium").notNull(),
  stage: text("stage").notNull(),
  matchday: integer("matchday").notNull().default(1),
  group: text("group"),
  status: text("status").notNull().default("scheduled"),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

const ADMIN_CLERK_ID = "user_3EVYiCvGQ24CfcJew9jLYd13HjE";

export const requireAdmin = (req: any, res: any, next: any) => {
  if (req.clerkUserId !== ADMIN_CLERK_ID) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
};

export const insertMatchSchema = createInsertSchema(matchesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matchesTable.$inferSelect;
