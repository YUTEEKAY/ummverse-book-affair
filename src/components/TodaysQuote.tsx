import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Quote } from "lucide-react";
import { motion } from "framer-motion";

interface QuoteData {
  id: string;
  text: string;
  author: string;
  book_title: string | null;
}

const TodaysQuote = () => {
  const [quote, setQuote] = useState<QuoteData | null>(null);
  useEffect(() => {
    const fetchRandomQuote = async () => {
      // Get total count first
      const { count } = await supabase
        .from("quotes")
        .select("*", { count: "exact", head: true });

      if (count && count > 0) {
        // Generate random offset
        const randomOffset = Math.floor(Math.random() * count);
        
        // Fetch single random quote using offset
        const { data } = await supabase
          .from("quotes")
          .select("*")
          .range(randomOffset, randomOffset)
          .single();

        if (data) {
          setQuote(data);
        }
      }
    };

    fetchRandomQuote();
  }, []);

  if (!quote) return null;

  return (
    <section aria-labelledby="todays-quote-title" className="px-6 py-10 sm:py-14">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="editorial-quote-panel relative overflow-hidden rounded-md px-6 py-8 shadow-soft sm:px-10 sm:py-11 lg:px-14">
            <Quote aria-hidden="true" className="absolute right-6 top-6 h-12 w-12 opacity-15 sm:right-10 sm:top-8 sm:h-16 sm:w-16" />
            <div className="relative max-w-4xl">
              <h2 id="todays-quote-title" className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-accent">A line to linger on</h2>
              <blockquote>
                <p className="max-w-4xl font-serif text-2xl leading-snug sm:text-3xl lg:text-4xl">“{quote.text}”</p>
              </blockquote>
              <div className="mt-6 border-t border-primary-foreground/25 pt-4">
                <p className="font-serif text-base italic">{quote.author}</p>
                {quote.book_title && <p className="mt-1 text-sm text-primary-foreground/70">{quote.book_title}</p>}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TodaysQuote;
