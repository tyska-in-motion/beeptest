
import { pgTable, text, serial, jsonb, timestamp, integer } from "drizzle-orm/pg-core";
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
}).extend({
  steps: z.array(stepSchema),
});

export type Sequence = typeof sequences.$inferSelect;
export type InsertSequence = z.infer<typeof insertSequenceSchema>;

// API Types
export type CreateSequenceRequest = InsertSequence;
export type UpdateSequenceRequest = Partial<InsertSequence>;

export const trainingConditionEnum = z.enum(["SZTOS", "OK", "SŁABO"]);
export type TrainingCondition = z.infer<typeof trainingConditionEnum>;

export const trainingNotes = pgTable("training_notes", {
  id: serial("id").primaryKey(),
  sequenceId: integer("sequence_id")
    .notNull()
    .references(() => sequences.id, { onDelete: "cascade" }),
  condition: text("condition").$type<TrainingCondition>().notNull(),
  resultComment: text("result_comment").notNull(),
  noteDate: timestamp("note_date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTrainingNoteSchema = createInsertSchema(trainingNotes)
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    condition: trainingConditionEnum,
    resultComment: z.string().min(1, "Wynik jest wymagany"),
  });

export type TrainingNote = typeof trainingNotes.$inferSelect;
export type InsertTrainingNote = z.infer<typeof insertTrainingNoteSchema>;
