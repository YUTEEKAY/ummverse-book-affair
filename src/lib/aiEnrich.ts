import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";

export type AiEnrichment = {
  description: string; genres: string[]; mood_tags: string[]; themes: string[];
  cover_url: string | null; isbn13: string | null;
};

export async function aiEnrichBook(input: { title?: string; author?: string; book_id?: string }) {
  const { data, error } = await supabase.functions.invoke("ai-enrich-book", { body: input });
  if (error) {
    let msg = error.message;
    if (error instanceof FunctionsHttpError) {
      try { msg = (await error.context.json()).error ?? msg; } catch { /* keep default */ }
    }
    throw new Error(typeof msg === "string" ? msg : "Auto-fill failed");
  }
  return data as { enrichment: AiEnrichment; saved: boolean };
}
