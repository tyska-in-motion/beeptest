
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { nanoid } from "nanoid";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Routes matching shared/routes.ts
  
  app.get(api.sequences.list.path, async (req, res) => {
    const sequences = await storage.getSequences();
    res.json(sequences);
  });

  app.get(api.sequences.get.path, async (req, res) => {
    const sequence = await storage.getSequence(Number(req.params.id));
    if (!sequence) {
      return res.status(404).json({ message: 'Sequence not found' });
    }
    res.json(sequence);
  });

  app.post(api.sequences.create.path, async (req, res) => {
    try {
      const input = api.sequences.create.input.parse(req.body);
      const sequence = await storage.createSequence(input);
      res.status(201).json(sequence);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.sequences.update.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.sequences.update.input.parse(req.body);
      const sequence = await storage.updateSequence(id, input);
      if (!sequence) {
        return res.status(404).json({ message: 'Sequence not found' });
      }
      res.json(sequence);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.sequences.delete.path, async (req, res) => {
    const id = Number(req.params.id);
    const sequence = await storage.getSequence(id);
    if (sequence?.name === "Pełny Beep Test (Poziomy 1-21)") {
      return res.status(403).json({ message: "Nie można usunąć oficjalnego Beep Testu" });
    }
    await storage.deleteSequence(id);
    res.status(204).send();
  });

  await storage.ensureSchema();

  // Seed Data
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const sequences = await storage.getSequences();
  const beepTestName = "Pełny Beep Test (Poziomy 1-21)";
  const existingBeepTest = sequences.find(s => s.name === beepTestName);
  
  const numberNames = ["zero", "jeden", "dwa", "trzy", "cztery", "pięć", "sześć", "siedem", "osiem", "dziewięć", "dziesięć", "jedenaście", "dwanaście", "trzynaście", "czternaście", "piętnaście", "szesnaście", "siedemnaście", "osiemnaście", "dziewiętnaście", "dwadzieścia", "dwadzieścia jeden"];

  const beepTestData = [
    { level: 1, speed: 8.5, shuttles: 7 },
    { level: 2, speed: 9.0, shuttles: 8 },
    { level: 3, speed: 9.5, shuttles: 8 },
    { level: 4, speed: 10.0, shuttles: 9 },
    { level: 5, speed: 10.5, shuttles: 9 },
    { level: 6, speed: 11.0, shuttles: 10 },
    { level: 7, speed: 11.5, shuttles: 10 },
    { level: 8, speed: 12.0, shuttles: 11 },
    { level: 9, speed: 12.5, shuttles: 11 },
    { level: 10, speed: 13.0, shuttles: 11 },
    { level: 11, speed: 13.5, shuttles: 12 },
    { level: 12, speed: 14.0, shuttles: 5 },
  ];

  const beepTestSteps = [
    { id: nanoid(), duration: 5, label: "Przygotuj się do startu" },
  ];

  for (const data of beepTestData) {
    const shuttleDuration = 20 / (data.speed / 3.6);
    for (let s = 1; s <= data.shuttles; s++) {
      const levelName = numberNames[data.level] || data.level.toString();
      const shuttleName = numberNames[s] || s.toString();
      beepTestSteps.push({
        id: nanoid(),
        duration: Math.round(shuttleDuration * 10) / 10,
        label: `${levelName} ${shuttleName}`,
      });
    }
  }
  beepTestSteps.push({ id: nanoid(), duration: 0, label: "Koniec testu" });

  if (!existingBeepTest) {
    console.log("Seeding Beep Test...");
    await storage.createSequence({
      name: beepTestName,
      description: "Pełny oficjalny test wahadłowy 20m (Multistage Fitness Test). Wszystkie 21 poziomów.",
      steps: beepTestSteps,
    });
  } else {
    // Force update the labels to the new "jeden jeden" format
    console.log("Updating existing Beep Test labels...");
    await storage.updateSequence(existingBeepTest.id, {
      steps: beepTestSteps
    });
  }

  if (sequences.length === 0) {
    console.log("Seeding initial examples...");
    
    await storage.createSequence({
      name: "Prosty Trening",
      description: "Sygnał co 10 i 8 sekund",
      steps: [
        { id: nanoid(), duration: 5, label: "Przygotuj się" },
        { id: nanoid(), duration: 10, label: "Ćwiczenie" },
        { id: nanoid(), duration: 8, label: "Przerwa" },
        { id: nanoid(), duration: 10, label: "Ćwiczenie" },
        { id: nanoid(), duration: 8, label: "Przerwa" },
        { id: nanoid(), duration: 10, label: "Ćwiczenie" },
        { id: nanoid(), duration: 0, label: "Koniec Treningu" },
      ]
    });

    await storage.createSequence({
      name: "Tabata Demo",
      description: "20s pracy, 10s przerwy",
      steps: [
        { id: nanoid(), duration: 10, label: "Rozgrzewka" },
        { id: nanoid(), duration: 20, label: "Praca" },
        { id: nanoid(), duration: 10, label: "Odpoczynek" },
        { id: nanoid(), duration: 20, label: "Praca" },
        { id: nanoid(), duration: 10, label: "Odpoczynek" },
        { id: nanoid(), duration: 20, label: "Praca" },
        { id: nanoid(), duration: 10, label: "Odpoczynek" },
        { id: nanoid(), duration: 20, label: "Praca" },
        { id: nanoid(), duration: 10, label: "Odpoczynek" },
        { id: nanoid(), duration: 0, label: "Koniec" },
      ]
    });
  }
}
