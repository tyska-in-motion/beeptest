
import { db } from "./db";
import {
  sequences,
  type Sequence,
  type InsertSequence,
  type UpdateSequenceRequest,
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  getSequences(): Promise<Sequence[]>;
  getSequence(id: number): Promise<Sequence | undefined>;
  createSequence(sequence: InsertSequence): Promise<Sequence>;
  updateSequence(id: number, updates: UpdateSequenceRequest): Promise<Sequence | undefined>;
  deleteSequence(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getSequences(): Promise<Sequence[]> {
    return await db.select().from(sequences).orderBy(sequences.createdAt);
  }

  async getSequence(id: number): Promise<Sequence | undefined> {
    const [sequence] = await db.select().from(sequences).where(eq(sequences.id, id));
    return sequence;
  }

  async createSequence(sequence: InsertSequence): Promise<Sequence> {
    const [created] = await db.insert(sequences).values(sequence).returning();
    return created;
  }

  async updateSequence(id: number, updates: UpdateSequenceRequest): Promise<Sequence | undefined> {
    const [updated] = await db
      .update(sequences)
      .set(updates)
      .where(eq(sequences.id, id))
      .returning();
    return updated;
  }

  async deleteSequence(id: number): Promise<void> {
    await db.delete(sequences).where(eq(sequences.id, id));
  }
}

export const storage = new DatabaseStorage();
