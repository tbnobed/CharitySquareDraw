import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const gameRounds = pgTable("game_rounds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roundNumber: integer("round_number").notNull(),
  status: text("status").notNull().default("active"), // "active", "completed"
  pricePerSquare: integer("price_per_square").notNull().default(10), // price in cents
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  winnerSquare: integer("winner_square"),
  totalRevenue: integer("total_revenue").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const participants = pgTable("participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  gameRoundId: varchar("game_round_id").notNull(),
  squares: jsonb("squares").$type<number[]>().notNull(),
  totalAmount: integer("total_amount").notNull(),
  paymentStatus: text("payment_status").notNull().default("pending"), // "pending", "paid"
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const squares = pgTable("squares", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  number: integer("number").notNull(),
  gameRoundId: varchar("game_round_id").notNull(),
  participantId: varchar("participant_id"),
  status: text("status").notNull().default("available"), // "available", "reserved", "sold"
  reservedAt: timestamp("reserved_at"),
  soldAt: timestamp("sold_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertGameRoundSchema = createInsertSchema(gameRounds).omit({
  id: true,
  startedAt: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertParticipantSchema = createInsertSchema(participants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSquareSchema = createInsertSchema(squares).omit({
  id: true,
  reservedAt: true,
  soldAt: true,
  createdAt: true,
  updatedAt: true,
});

export const participantFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  squares: z.array(z.number()).min(1, "At least one square must be selected"),
});

export type InsertGameRound = z.infer<typeof insertGameRoundSchema>;
export type InsertParticipant = z.infer<typeof insertParticipantSchema>;
export type InsertSquare = z.infer<typeof insertSquareSchema>;
export type ParticipantForm = z.infer<typeof participantFormSchema>;

export type GameRound = typeof gameRounds.$inferSelect;
export type Participant = typeof participants.$inferSelect;
export type Square = typeof squares.$inferSelect;

export interface GameStats {
  totalRevenue: number;
  participantCount: number;
  squaresSold: number;
  percentFilled: number;
  availableCount: number;
  currentRound: number;
}

export interface BoardUpdate {
  type: 'SQUARE_UPDATE' | 'PARTICIPANT_ADDED' | 'GAME_RESET' | 'STATS_UPDATE' | 'CONNECTION_ESTABLISHED' | 'SQUARE_SELECTION' | 'WINNER_DRAWN';
  data: any;
}
