import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Quote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface QuoteData {
  id: string;
  text: string;
  author: string;
  book_title: string | null;
}

const QuoteCarousel = () => {
  const [quotes, setQuotes] = useState<QuoteData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchQuotes = async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .limit(5);
      
      if (data && !error) {
        setQuotes(data);
      }
    };

    fetchQuotes();
  }, []);

  useEffect(() => {
    if (quotes.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % quotes.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [quotes.length]);

  if (quotes.length === 0) {
    return null;
  }

  const currentQuote = quotes[currentIndex];

  return (
    <section className="py-20 px-6 bg-secondary/30">
      <div className="max-w-4xl mx-auto">
        <Card className="p-12 shadow-card border-none bg-card/80 backdrop-blur-sm">
          <Quote className="w-12 h-12 text-primary mb-6 mx-auto" />
          
          <blockquote className="text-2xl md:text-3xl font-serif text-center mb-6 italic leading-relaxed">
            "{currentQuote.text}"
          </blockquote>
          
          <div className="text-center">
            <p className="text-lg font-medium text-foreground">
              — {currentQuote.author}
            </p>
            {currentQuote.book_title && (
              <p className="text-muted-foreground italic">
                {currentQuote.book_title}
              </p>
            )}
          </div>

          <div className="flex justify-center gap-2 mt-8">
            {quotes.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentIndex 
                    ? "bg-primary w-8" 
                    : "bg-muted-foreground/30"
                }`}
                aria-label={`Go to quote ${idx + 1}`}
              />
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
};

export default QuoteCarousel;
