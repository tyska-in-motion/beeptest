import { useSequences, useDeleteSequence } from "@/hooks/use-sequences";
import { SequenceCard } from "@/components/sequence-card";
import { Link } from "wouter";
import { Plus, Dumbbell, Timer, NotebookPen } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: sequences, isLoading } = useSequences();
  const { mutate: deleteSequence, isPending: isDeleting } = useDeleteSequence();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground animate-pulse">Ładowanie Twoich treningów...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Hero Header */}
      <div className="relative bg-secondary/20 border-b border-border">
        <div className="absolute inset-0 bg-grid-white/[0.02]" />
        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4 border border-primary/20">
              <Timer className="w-3.5 h-3.5" />
              Interval Master
            </div>
            <h1 className="text-4xl md:text-5xl font-bold font-display tracking-tight text-white mb-4">
              Beep <span className="text-primary">test</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Trenuj, trenuj i jeszcze raz trenuj, żeby zdobyć maksimum punktów w testach sprawnościowych.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold font-display flex items-center gap-2">
            <Dumbbell className="w-6 h-6 text-primary" />
            Dostępne sekwencje
          </h2>
          <div className="hidden sm:flex items-center gap-3">
            <Link href="/notes" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold transition-all">
              <NotebookPen className="w-5 h-5" />
              Notatki
            </Link>
            <Link href="/create" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-0.5 active:translate-y-0">
              <Plus className="w-5 h-5" />
              Nowa Sekwencja
            </Link>
          </div>
        </div>

        {sequences?.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24 bg-card/30 rounded-3xl border border-dashed border-border"
          >
            <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Plus className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Brak zapisanych treningów</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Nie masz jeszcze żadnych sekwencji. Stwórz swoją pierwszą sekwencję interwałową, aby zacząć trening.
            </p>
            <Link href="/create" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/25 transition-all">
              <Plus className="w-5 h-5" />
              Stwórz pierwszy trening
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sequences?.map((seq, index) => (
              <motion.div
                key={seq.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <SequenceCard 
                  sequence={seq} 
                  onDelete={deleteSequence}
                  isDeleting={isDeleting}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile FAB */}
      <Link href="/create" className="fixed bottom-6 right-6 sm:hidden w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-xl shadow-primary/30 flex items-center justify-center z-50">
        <Plus className="w-7 h-7" />
      </Link>
      <Link href="/notes" className="fixed bottom-24 right-6 sm:hidden w-14 h-14 bg-secondary text-secondary-foreground rounded-full shadow-xl flex items-center justify-center z-50">
        <NotebookPen className="w-6 h-6" />
      </Link>
    </div>
  );
}
