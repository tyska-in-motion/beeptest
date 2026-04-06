import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateSequence, useSequence, useUpdateSequence } from "@/hooks/use-sequences";
import { insertSequenceSchema, type Step } from "@shared/schema";
import { Plus, Trash2, Save, ArrowLeft, GripVertical, Play } from "lucide-react";
import { nanoid } from "nanoid";
import { useToast } from "@/hooks/use-toast";
import { motion, Reorder } from "framer-motion";
import { Button } from "@/components/ui/button";

// Extend schema for form usage (steps must be array, not jsonb)
const formSchema = insertSequenceSchema.extend({
  steps: z.array(z.object({
    id: z.string(),
    duration: z.coerce.number().min(0.1, "Minimum 0.1 sekundy"),
    label: z.string().min(1, "Etykieta jest wymagana"),
  })).min(1, "Dodaj przynajmniej jeden krok"),
});

type FormValues = z.infer<typeof formSchema>;

export default function Editor() {
  const [match, params] = useRoute("/editor/:id");
  const isEditMode = Boolean(match);
  const sequenceId = params?.id ? parseInt(params.id) : undefined;
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: existingSequence, isLoading: isLoadingSequence } = useSequence(sequenceId || 0);
  const { mutate: createSequence, isPending: isCreating } = useCreateSequence();
  const { mutate: updateSequence, isPending: isUpdating } = useUpdateSequence();
  
  const isPending = isCreating || isUpdating;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      steps: [
        { id: nanoid(), label: "Rozgrzewka", duration: 60 },
        { id: nanoid(), label: "Ćwiczenie", duration: 45 },
        { id: nanoid(), label: "Przerwa", duration: 15 },
      ],
    },
  });

  const { fields, append, remove, move, replace } = useFieldArray({
    control: form.control,
    name: "steps",
  });

  // Populate form when editing
  useEffect(() => {
    if (existingSequence) {
      form.reset({
        name: existingSequence.name,
        description: existingSequence.description || "",
        steps: existingSequence.steps as Step[],
      });
    }
  }, [existingSequence, form]);

  const onSubmit = (data: FormValues) => {
    if (isEditMode && sequenceId) {
      updateSequence(
        { id: sequenceId, ...data },
        { onSuccess: () => setLocation("/") }
      );
    } else {
      createSequence(data, { onSuccess: () => setLocation("/") });
    }
  };

  const handleDragReorder = (newOrder: Step[]) => {
    replace(newOrder);
  };

  if (isEditMode && isLoadingSequence) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold font-display hidden sm:block">
              {isEditMode ? "Edytuj Sekwencję" : "Nowa Sekwencja"}
            </h1>
          </div>
          
          <Button 
            onClick={form.handleSubmit(onSubmit)} 
            disabled={isPending}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20"
          >
            {isPending ? "Zapisywanie..." : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Zapisz
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          {/* General Info Card */}
          <div className="glass-panel rounded-2xl p-6">
            <div className="grid gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Nazwa treningu</label>
                <input
                  {...form.register("name")}
                  placeholder="np. Tabata, HIIT, Rozciąganie..."
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all font-display text-lg font-bold"
                />
                {form.formState.errors.name && (
                  <p className="text-destructive text-sm">{form.formState.errors.name.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Opis (opcjonalnie)</label>
                <textarea
                  {...form.register("description")}
                  placeholder="Krótki opis treningu..."
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all min-h-[80px]"
                />
              </div>
            </div>
          </div>

          {/* Steps List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-lg font-bold font-display flex items-center gap-2">
                <Play className="w-5 h-5 text-primary" />
                Kroki sekwencji
              </h2>
              <span className="text-sm text-muted-foreground">
                {fields.length} kroków • {Math.floor(fields.reduce((acc, curr) => acc + (Number(curr.duration) || 0), 0) / 60)} min
              </span>
            </div>

            <Reorder.Group axis="y" values={fields} onReorder={handleDragReorder} className="space-y-3">
              {fields.map((field, index) => (
                <Reorder.Item 
                  key={field.id} 
                  value={field}
                  className="bg-card border border-border/50 rounded-xl p-4 flex items-center gap-4 group hover:border-primary/30 transition-colors shadow-sm"
                >
                  <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1">
                    <GripVertical className="w-5 h-5" />
                  </div>

                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground ml-1">Nazwa / Komenda głosowa</label>
                      <input
                        {...form.register(`steps.${index}.label`)}
                        placeholder="Nazwa kroku"
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm font-medium"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground ml-1">Czas (sek)</label>
                      <div className="relative">
                        <input
                          type="number"
                          {...form.register(`steps.${index}.duration`)}
                          step="0.1"
                          className="w-full bg-background border border-border rounded-lg pl-3 pr-8 py-2 focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm font-timer font-bold"
                        />
                        <span className="absolute right-3 top-2 text-xs text-muted-foreground font-medium">s</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </Reorder.Item>
              ))}
            </Reorder.Group>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <button
                type="button"
                onClick={() => append({ id: nanoid(), label: "Praca", duration: 30 })}
                className="flex items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Dodaj Pracę (30s)
              </button>
              <button
                type="button"
                onClick={() => append({ id: nanoid(), label: "Przerwa", duration: 15 })}
                className="flex items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-secondary/50 bg-secondary/20 hover:bg-secondary/30 text-secondary-foreground font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Dodaj Przerwę (15s)
              </button>
              <button
                type="button"
                onClick={() => {
                  const currentSteps = form.getValues("steps");
                  if (currentSteps.length > 0) {
                    const lastStep = currentSteps[currentSteps.length - 1];
                    append({ ...lastStep, id: nanoid() });
                  }
                }}
                className="col-span-2 flex items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-muted-foreground/30 bg-muted/5 hover:bg-muted/10 text-muted-foreground font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Duplikuj ostatni krok
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
