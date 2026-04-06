import { Sequence } from "@shared/schema";
import { Link } from "wouter";
import { Clock, Play, Trash2, Edit } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SequenceCardProps {
  sequence: Sequence;
  onDelete: (id: number) => void;
  isDeleting?: boolean;
}

export function SequenceCard({ sequence, onDelete, isDeleting }: SequenceCardProps) {
  const totalDuration = sequence.steps.reduce((acc, step) => acc + step.duration, 0);
  const totalSteps = sequence.steps.length;

  const formatDuration = (seconds: number) => {
    const roundedSeconds = Math.round(seconds);
    const m = Math.floor(roundedSeconds / 60);
    const s = roundedSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isPermanentBeepTest = sequence.name === "Pełny Beep Test (Poziomy 1-21)";

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-primary/5">
      {/* Decorative gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative p-6 flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold font-display text-foreground group-hover:text-primary transition-colors">
              {sequence.name}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
              {sequence.description || "Bez opisu"}
            </p>
          </div>
          <div className="p-2 rounded-full bg-secondary/50 text-primary">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="flex items-center gap-4 mt-auto mb-6 text-sm text-muted-foreground font-medium">
          <div className="flex items-center gap-1.5">
            <span className="text-foreground">{totalSteps}</span> kroków
          </div>
          <div className="w-1 h-1 rounded-full bg-border" />
          <div className="flex items-center gap-1.5">
            <span className="text-foreground">{formatDuration(totalDuration)}</span> łącznie
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <Link href={`/editor/${sequence.id}`} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium text-sm transition-colors border border-white/5">
            <Edit className="w-4 h-4" />
            Edytuj
          </Link>
          <Link href={`/player/${sequence.id}`} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm transition-all hover:scale-[1.02] shadow-lg shadow-primary/20">
            <Play className="w-4 h-4 fill-current" />
            Start
          </Link>
        </div>

        {!isPermanentBeepTest && (
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button 
                  className="p-2 rounded-full hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Czy na pewno chcesz usunąć?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tej operacji nie można cofnąć. Sekwencja "{sequence.name}" zostanie trwale usunięta.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Anuluj</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(sequence.id)} className="bg-destructive hover:bg-destructive/90">
                    Usuń
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </div>
  );
}
