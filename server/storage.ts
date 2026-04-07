import { db, hasDatabaseConnectionString } from "./db";
import {
  sequences,
  trainingNotes,
  type Sequence,
  type InsertSequence,
  type UpdateSequenceRequest,
  type TrainingNote,
  type InsertTrainingNote,
} from "@shared/schema";
import { eq, sql } from "drizzle-orm";

export interface IStorage {
  ensureSchema(): Promise<void>;
  getSequences(): Promise<Sequence[]>;
  getSequence(id: number): Promise<Sequence | undefined>;
  createSequence(sequence: InsertSequence): Promise<Sequence>;
  updateSequence(id: number, updates: UpdateSequenceRequest): Promise<Sequence | undefined>;
  deleteSequence(id: number): Promise<void>;
  getTrainingNotes(): Promise<TrainingNote[]>;
  createTrainingNote(note: InsertTrainingNote): Promise<TrainingNote>;
  deleteTrainingNote(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  private getDb() {
    if (!db) {
      throw new Error("Database is not initialized");
    }
    return db;
  }

  async ensureSchema(): Promise<void> {
    await this.getDb().execute(sql`
      CREATE TABLE IF NOT EXISTS sequences (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        steps JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await this.getDb().execute(sql`
      CREATE TABLE IF NOT EXISTS training_notes (
        id SERIAL PRIMARY KEY,
        sequence_id INTEGER NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
        condition TEXT NOT NULL,
        result_comment TEXT NOT NULL DEFAULT '',
        note_date TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await this.getDb().execute(sql`
      ALTER TABLE training_notes
      ADD COLUMN IF NOT EXISTS result_comment TEXT NOT NULL DEFAULT ''
    `);
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

  async getTrainingNotes(): Promise<TrainingNote[]> {
    return await this.getDb().select().from(trainingNotes).orderBy(sql`${trainingNotes.noteDate} DESC`);
  }

  async createTrainingNote(note: InsertTrainingNote): Promise<TrainingNote> {
    const [created] = await this.getDb().insert(trainingNotes).values(note).returning();
    return created;
  }

  async deleteTrainingNote(id: number): Promise<boolean> {
    const deleted = await this.getDb().delete(trainingNotes).where(eq(trainingNotes.id, id)).returning({ id: trainingNotes.id });
    return deleted.length > 0;
  }
}

export class MemoryStorage implements IStorage {
  async ensureSchema(): Promise<void> {
    // no-op for in-memory storage
  }

  private items: Sequence[] = [];
  private notes: TrainingNote[] = [];
  private nextId = 1;
  private nextNoteId = 1;

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
    this.notes = this.notes.filter((note) => note.sequenceId !== id);
  }

  async getTrainingNotes(): Promise<TrainingNote[]> {
    return [...this.notes].sort((a, b) => {
      const aTime = a.noteDate ? new Date(a.noteDate).getTime() : 0;
      const bTime = b.noteDate ? new Date(b.noteDate).getTime() : 0;
      return bTime - aTime;
    });
  }

  async createTrainingNote(note: InsertTrainingNote): Promise<TrainingNote> {
    const created: TrainingNote = {
      id: this.nextNoteId++,
      sequenceId: note.sequenceId,
      condition: note.condition,
      resultComment: note.resultComment,
      noteDate: note.noteDate ? new Date(note.noteDate) : new Date(),
      createdAt: new Date(),
    };

    this.notes.push(created);
    return created;
  }

  async deleteTrainingNote(id: number): Promise<boolean> {
    const before = this.notes.length;
    this.notes = this.notes.filter((note) => note.id !== id);
    return this.notes.length < before;
  }
}

export const storage = hasDatabaseConnectionString
  ? new DatabaseStorage()
  : new MemoryStorage();
