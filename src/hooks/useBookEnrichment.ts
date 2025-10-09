import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useBookEnrichment = () => {
  const enrichBook = async (bookId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('enrich-single-book', {
        body: { bookId }
      });

      if (error) {
        toast.error("Failed to enrich book", {
          description: error.message
        });
        return { data: null, error };
      }

      if (data?.updated) {
        toast.success("✨ Ummverse magic — book details and covers added!", {
          description: `Updated ${data.fields?.length || 0} fields`
        });
      } else {
        toast.info("Book already has complete data", {
          description: data?.message || "No new information available"
        });
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error enriching book:', error);
      toast.error("Failed to enrich book", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
      return { data: null, error };
    }
  };

  return { enrichBook };
};
