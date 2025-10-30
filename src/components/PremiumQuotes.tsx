import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Quote, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

interface QuoteData {
  text: string;
  author: string;
  book_title: string;
  book_id: string | null;
}

const PremiumQuotes = () => {
  const { profile } = useAuth();
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Only show for premium users
  if (!profile || profile.subscription_tier === 'free') {
    return null;
  }

  useEffect(() => {
    const fetchQuote = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('generate-quote');
        
        if (error) {
          console.error('Error fetching quote:', error);
          return;
        }

        if (data) {
          setQuote(data);
        }
      } catch (error) {
        console.error('Error fetching quote:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuote();
  }, []);

  if (isLoading) {
    return (
      <section className="py-16 px-6 bg-gradient-to-b from-background via-blush/10 to-background">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-primary animate-pulse" />
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary">
                Romance Quote
              </h2>
              <Sparkles className="w-6 h-6 text-primary animate-pulse" />
            </div>
            <p className="text-muted-foreground">
              Exclusive for premium members
            </p>
          </div>
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </section>
    );
  }

  if (!quote) return null;

  return (
    <section className="py-16 px-6 bg-gradient-to-b from-background via-blush/10 to-background">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary">
              Romance Quote
            </h2>
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <p className="text-muted-foreground">
            Exclusive for premium members
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto"
        >
          <Card className="relative p-8 md:p-12 rounded-2xl shadow-card hover:shadow-hover transition-all duration-300 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm border-dusty-rose/20">
            <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-romance rounded-full flex items-center justify-center shadow-soft">
              <Quote className="w-6 h-6 text-white" />
            </div>

            <div className="space-y-6 mt-2">
              <blockquote className="text-xl md:text-2xl leading-relaxed text-foreground font-serif italic text-center">
                "{quote.text}"
              </blockquote>

              <div className="pt-6 border-t border-dusty-rose/20 text-center">
                <p className="text-base font-medium text-primary">
                  — {quote.author}
                </p>
                {quote.book_title && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {quote.book_title}
                  </p>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

export default PremiumQuotes;
