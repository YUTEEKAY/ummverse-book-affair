import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useSavedBooks() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ["saved-book-ids", user?.id];
  const { data: ids = new Set<string>() } = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("saved_books").select("book_id");
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.book_id));
    },
  });

  const toggle = async (bookId: string) => {
    if (!user) return { needsSignIn: true as const };
    const saved = ids.has(bookId);
    const { error } = saved
      ? await supabase.from("saved_books").delete().eq("book_id", bookId).eq("user_id", user.id)
      : await supabase.from("saved_books").insert({ book_id: bookId, user_id: user.id });
    if (error) throw error;
    qc.invalidateQueries({ queryKey: ["saved-book-ids"] });
    qc.invalidateQueries({ queryKey: ["saved-books"] });
    return { saved: !saved };
  };
  return { ids, toggle, signedIn: !!user };
}
