
import { pgTable, text, serial, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define the step structure for TypeScript validation
const stepSchema = z.object({
  id: z.string(), // unique ID for frontend keys
  duration: z.number().min(0.1), // in seconds, support decimals
  label: z.string(), // What the TTS will say, e.g., "Sygnał 1"
});

export type Step = z.infer<typeof stepSchema>;

export const sequences = pgTable("sequences", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  // Storing steps as a JSONB array
  steps: jsonb("steps").$type<Step[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSequenceSchema = createInsertSchema(sequences).omit({ 
  id: true, 
  createdAt: true 
});

export type Sequence = typeof sequences.$inferSelect;
export type InsertSequence = z.infer<typeof insertSequenceSchema>;

// API Types
export type CreateSequenceRequest = InsertSequence;
export type UpdateSequenceRequest = Partial<InsertSequence>;
