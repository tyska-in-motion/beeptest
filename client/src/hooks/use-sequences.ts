import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertSequence, type Sequence } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useSequences() {
  return useQuery({
    queryKey: [api.sequences.list.path],
    queryFn: async () => {
      const res = await fetch(api.sequences.list.path);
      if (!res.ok) throw new Error("Failed to fetch sequences");
      return api.sequences.list.responses[200].parse(await res.json());
    },
  });
}

export function useSequence(id: number) {
  return useQuery({
    queryKey: [api.sequences.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.sequences.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch sequence");
      return api.sequences.get.responses[200].parse(await res.json());
    },
    enabled: !isNaN(id),
  });
}

export function useCreateSequence() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertSequence) => {
      const validated = api.sequences.create.input.parse(data);
      const res = await fetch(api.sequences.create.path, {
        method: api.sequences.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.sequences.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create sequence");
      }
      return api.sequences.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.sequences.list.path] });
      toast({
        title: "Sukces",
        description: "Nowa sekwencja została utworzona.",
      });
    },
    onError: (error) => {
      toast({
        title: "Błąd",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateSequence() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertSequence>) => {
      const validated = api.sequences.update.input.parse(updates);
      const url = buildUrl(api.sequences.update.path, { id });
      const res = await fetch(url, {
        method: api.sequences.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.sequences.update.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        if (res.status === 404) throw new Error("Sequence not found");
        throw new Error("Failed to update sequence");
      }
      return api.sequences.update.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.sequences.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.sequences.get.path, variables.id] });
      toast({
        title: "Zapisano",
        description: "Sekwencja została zaktualizowana.",
      });
    },
    onError: (error) => {
      toast({
        title: "Błąd",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteSequence() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.sequences.delete.path, { id });
      const res = await fetch(url, { method: api.sequences.delete.method });
      if (res.status === 404) throw new Error("Sequence not found");
      if (!res.ok) throw new Error("Failed to delete sequence");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.sequences.list.path] });
      toast({
        title: "Usunięto",
        description: "Sekwencja została trwale usunięta.",
      });
    },
  });
}
