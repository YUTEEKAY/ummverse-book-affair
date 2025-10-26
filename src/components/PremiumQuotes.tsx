import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Quote, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

interface QuoteData {
  id: string;
  text: string;
  author: string;
  book_title: string | null;
}

const PremiumQuotes = () => {
  const { profile } = useAuth();
  const [quotes, setQuotes] = useState<QuoteData[]>([]);

  // Only show for premium users
  if (!profile || profile.subscription_tier === 'free') {
    return null;
  }

  useEffect(() => {
    const fetchQuotes = async () => {
      // Fetch 3 random quotes for premium users
      const { count } = await supabase
        .from("quotes")
        .select("*", { count: "exact", head: true });

      if (count && count > 0) {
        const quotes: QuoteData[] = [];
        const usedOffsets = new Set<number>();

        // Get 3 unique random quotes
        while (quotes.length < 3 && usedOffsets.size < Math.min(count, 10)) {
          const randomOffset = Math.floor(Math.random() * count);
          
          if (!usedOffsets.has(randomOffset)) {
            usedOffsets.add(randomOffset);
            
            const { data } = await supabase
              .from("quotes")
              .select("*")
              .range(randomOffset, randomOffset)
              .maybeSingle();

            if (data) {
              quotes.push(data);
            }
          }
        }

        setQuotes(quotes);
      }
    };

    fetchQuotes();
  }, []);

  if (quotes.length === 0) return null;

  return (
    <section className="py-16 px-6 bg-gradient-to-b from-background via-blush/10 to-background">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary">
              Romance Quotes
            </h2>
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <p className="text-muted-foreground">
            Exclusive for premium members
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {quotes.map((quote, index) => (
            <motion.div
              key={quote.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
            >
              <Card className="relative p-6 h-full rounded-2xl shadow-card hover:shadow-hover transition-all duration-300 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm border-dusty-rose/20 animate-float">
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-gradient-romance rounded-full flex items-center justify-center shadow-soft">
                  <Quote className="w-4 h-4 text-white" />
                </div>

                <div className="space-y-4 mt-2">
                  <blockquote className="text-base leading-relaxed text-foreground font-serif italic">
                    "{quote.text}"
                  </blockquote>

                  <div className="pt-4 border-t border-dusty-rose/20">
                    <p className="text-sm font-medium text-primary">
                      — {quote.author}
                    </p>
                    {quote.book_title && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {quote.book_title}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PremiumQuotes;
