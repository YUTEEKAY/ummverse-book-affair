import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
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
  const [showTypewriter, setShowTypewriter] = useState(false);

  useEffect(() => {
    const fetchRandomQuote = async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .limit(100);

      if (data && data.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.length);
        setQuote(data[randomIndex]);
        setTimeout(() => setShowTypewriter(true), 300);
      }
    };

    fetchRandomQuote();
  }, []);

  if (!quote) return null;

  return (
    <section className="py-16 px-6 bg-gradient-to-b from-background to-blush/20">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="relative p-8 md:p-12 rounded-3xl shadow-card animate-float bg-card/80 backdrop-blur-sm border-dusty-rose/20">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-gradient-romance rounded-full flex items-center justify-center shadow-soft animate-shimmer">
              <Quote className="w-6 h-6 text-white" />
            </div>

            <div className="text-center space-y-6 mt-4">
              <h2 className="text-2xl md:text-3xl font-serif text-primary mb-8">
                Today's Quote
              </h2>

              <blockquote className="relative">
                <p
                  className={`text-xl md:text-2xl font-serif text-foreground leading-relaxed ${
                    showTypewriter ? "animate-typewriter" : "opacity-0"
                  }`}
                  style={{
                    display: showTypewriter ? "inline-block" : "block",
                  }}
                >
                  "{quote.text}"
                </p>
              </blockquote>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3.5, duration: 0.8 }}
                className="space-y-1"
              >
                <p className="text-lg md:text-xl italic text-muted-foreground font-serif">
                  — {quote.author}
                </p>
                {quote.book_title && (
                  <p className="text-sm text-muted-foreground">
                    {quote.book_title}
                  </p>
                )}
              </motion.div>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

export default TodaysQuote;
