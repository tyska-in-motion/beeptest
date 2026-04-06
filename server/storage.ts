import { db, hasDatabaseConnectionString } from "./db";
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
  private getDb() {
    if (!db) {
      throw new Error("Database is not initialized");
    }
    return db;
  }

  async getSequences(): Promise<Sequence[]> {
    return await this.getDb().select().from(sequences).orderBy(sequences.createdAt);
  }

  async getSequence(id: number): Promise<Sequence | undefined> {
    const [sequence] = await this.getDb().select().from(sequences).where(eq(sequences.id, id));
    return sequence;
  }

  async createSequence(sequence: InsertSequence): Promise<Sequence> {
    const [created] = await this.getDb().insert(sequences).values(sequence).returning();
    return created;
  }

  async updateSequence(id: number, updates: UpdateSequenceRequest): Promise<Sequence | undefined> {
    const [updated] = await this.getDb()
      .update(sequences)
      .set(updates)
      .where(eq(sequences.id, id))
      .returning();
    return updated;
  }

  async deleteSequence(id: number): Promise<void> {
    await this.getDb().delete(sequences).where(eq(sequences.id, id));
  }
}

export class MemoryStorage implements IStorage {
  private items: Sequence[] = [];
  private nextId = 1;

  async getSequences(): Promise<Sequence[]> {
    return [...this.items].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return aTime - bTime;
    });
  }

  async getSequence(id: number): Promise<Sequence | undefined> {
    return this.items.find((sequence) => sequence.id === id);
  }

  async createSequence(sequence: InsertSequence): Promise<Sequence> {
    const created: Sequence = {
      id: this.nextId++,
      name: sequence.name,
      description: sequence.description ?? null,
      steps: sequence.steps,
      createdAt: new Date(),
    };

    this.items.push(created);
    return created;
  }

  async updateSequence(id: number, updates: UpdateSequenceRequest): Promise<Sequence | undefined> {
    const index = this.items.findIndex((sequence) => sequence.id === id);
    if (index === -1) return undefined;

    const current = this.items[index];
    const updated: Sequence = {
      ...current,
      ...updates,
      description:
        updates.description === undefined ? current.description : (updates.description ?? null),
    };

    this.items[index] = updated;
    return updated;
  }

  async deleteSequence(id: number): Promise<void> {
    this.items = this.items.filter((sequence) => sequence.id !== id);
  }
}

export const storage = hasDatabaseConnectionString
  ? new DatabaseStorage()
  : new MemoryStorage();
