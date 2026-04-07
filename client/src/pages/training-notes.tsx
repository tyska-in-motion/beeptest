import { type FormEvent, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, CalendarDays, NotebookPen, Trash2 } from "lucide-react";
import { useSequences } from "@/hooks/use-sequences";
import { useCreateTrainingNote, useDeleteTrainingNote, useTrainingNotes } from "@/hooks/use-training-notes";
import type { TrainingCondition } from "@shared/schema";

const CONDITIONS: TrainingCondition[] = ["SZTOS", "OK", "SŁABO"];

const conditionStyles: Record<TrainingCondition, string> = {
  SZTOS: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  OK: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  SŁABO: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

export default function TrainingNotesPage() {
  const { data: sequences } = useSequences();
  const { data: notes, isLoading } = useTrainingNotes();
  const { mutate: createNote, isPending } = useCreateTrainingNote();
  const { mutate: deleteNote, isPending: isDeleting } = useDeleteTrainingNote();

  const [sequenceId, setSequenceId] = useState<number | "">("");
  const [condition, setCondition] = useState<TrainingCondition>("OK");
  const [resultComment, setResultComment] = useState("");

  const selectedSequence = sequences?.find((sequence) => sequence.id === sequenceId);

  const groupedNotes = useMemo(() => {
    if (!notes || !sequences) return [];

    const byDay = new Map<string, typeof notes>();

    for (const note of notes) {
      const dayKey = new Date(note.noteDate).toISOString().slice(0, 10);
      const current = byDay.get(dayKey) || [];
      current.push(note);
      byDay.set(dayKey, current);
    }

    return Array.from(byDay.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([day, dayNotes]) => ({
        day,
        items: dayNotes.map((note) => ({
          ...note,
          sequenceName: sequences.find((sequence) => sequence.id === note.sequenceId)?.name || `Trening #${note.sequenceId}`,
        })),
      }));
  }, [notes, sequences]);

  const onSave = (event: FormEvent) => {
    event.preventDefault();
    if (!sequenceId) return;

    createNote({
      sequenceId,
      condition,
      resultComment: resultComment.trim(),
    });
    setResultComment("");
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-3">
              <ArrowLeft className="w-4 h-4" />
              Powrót
            </Link>
            <h1 className="text-3xl font-bold font-display flex items-center gap-3">
              <NotebookPen className="w-7 h-7 text-primary" />
              Notatki z treningu
            </h1>
          </div>
        </div>

        <form onSubmit={onSave} className="rounded-2xl border border-border/60 bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Dodaj nowy wpis</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="space-y-2 text-sm">
              <span className="text-muted-foreground">Który trening</span>
              <select
                required
                value={sequenceId}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setSequenceId(value);
                }}
                className="w-full bg-background border border-border rounded-lg px-3 py-2"
              >
                <option value="">Wybierz trening...</option>
                {sequences?.map((sequence) => (
                  <option key={sequence.id} value={sequence.id}>{sequence.name}</option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm">
              <span className="text-muted-foreground">Stan fizyczny</span>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as TrainingCondition)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2"
              >
                {CONDITIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm">
              <span className="text-muted-foreground">Wynik (komentarz końcowy)</span>
              <textarea
                required
                rows={3}
                value={resultComment}
                onChange={(e) => setResultComment(e.target.value)}
                placeholder="Np. 7.4"
                className="w-full bg-background border border-border rounded-lg px-3 py-2"
              />
            </label>
          </div>

          {selectedSequence && (
            <p className="text-xs text-muted-foreground">
              Wybrany trening ma {selectedSequence.steps.length} kroków.
            </p>
          )}

          <button
            type="submit"
            disabled={!sequenceId || !resultComment.trim() || isPending}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold disabled:opacity-60"
          >
            {isPending ? "Zapisywanie..." : "Zapisz notatkę"}
          </button>
        </form>

        <section className="rounded-2xl border border-border/60 bg-card p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <CalendarDays className="w-5 h-5 text-primary" />
            Historia treningów według dni
          </h2>

          {isLoading ? (
            <p className="text-muted-foreground">Ładowanie historii...</p>
          ) : groupedNotes.length === 0 ? (
            <p className="text-muted-foreground">Brak zapisanych treningów.</p>
          ) : (
            <div className="space-y-6">
              {groupedNotes.map((group) => (
                <div key={group.day} className="space-y-3">
                  <h3 className="text-sm uppercase tracking-widest text-muted-foreground">
                    {new Date(group.day).toLocaleDateString("pl-PL", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </h3>

                  <div className="space-y-2">
                    {group.items.map((note) => (
                      <div
                        key={note.id}
                        className="rounded-xl border border-border/60 bg-background/40 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                      >
                        <div>
                          <p className="font-medium">{note.sequenceName}</p>
                          <p className="text-sm text-muted-foreground">
                            Wynik: {note.resultComment}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center border px-2.5 py-1 rounded-full text-xs font-bold w-fit ${conditionStyles[note.condition]}`}>
                            {note.condition}
                          </span>
                          <button
                            type="button"
                            onClick={() => deleteNote(note.id)}
                            disabled={isDeleting}
                            className="inline-flex items-center justify-center rounded-lg border border-border p-2 text-muted-foreground hover:text-foreground hover:border-rose-400/50 disabled:opacity-60"
                            aria-label="Usuń wpis treningowy"
                            title="Usuń wpis"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
