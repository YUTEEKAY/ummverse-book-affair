import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Heart, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import RecommendationCard from "./RecommendationCard";
import { useToast } from "@/hooks/use-toast";

interface RecommendationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface BookRecommendation {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  summary: string | null;
  genre: string | null;
  mood: string | null;
  trope: string | null;
  heat_level: string | null;
  whyYouLlLoveIt: string;
  source: 'database' | 'open_library' | 'google_books';
}

const categories = [
  { id: 'enemies-to-lovers', label: 'Enemies to Lovers', emoji: '💔' },
  { id: 'second-chance', label: 'Second Chance', emoji: '💌' },
  { id: 'royal-fantasy', label: 'Royal Fantasy', emoji: '👑' },
  { id: 'comfort-healing', label: 'Comfort & Healing', emoji: '🌷' },
  { id: 'dark-obsession', label: 'Dark Obsession', emoji: '🔥' },
];

const RecommendationModal = ({ open, onOpenChange }: RecommendationModalProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<BookRecommendation[]>([]);
  const { toast } = useToast();

  const handleCategorySelect = async (categoryId: string) => {
    setSelectedCategory(categoryId);
    setIsLoading(true);
    setRecommendations([]);

    try {
      const { data, error } = await supabase.functions.invoke('get-recommendations', {
        body: { category: categoryId }
      });

      if (error) throw error;

      setRecommendations(data.recommendations || []);
    } catch (error: any) {
      console.error('Error fetching recommendations:', error);
      toast({
        title: "Oops! 💔",
        description: error.message || "Failed to get recommendations. Try again in a moment.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedCategory(null);
    setRecommendations([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-blush/20 via-cream/20 to-dusty-rose/20 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-3xl font-serif text-center justify-center">
            <Heart className="w-8 h-8 text-primary fill-primary" />
            Find Your Perfect Romance
          </DialogTitle>
        </DialogHeader>

        {!selectedCategory && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 py-6"
          >
            <p className="text-center text-lg text-muted-foreground font-serif italic">
              What kind of love story calls to your heart today?
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Button
                    onClick={() => handleCategorySelect(category.id)}
                    size="lg"
                    className="w-full h-auto py-6 px-6 text-lg bg-gradient-to-br from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 border-2 border-primary/20 hover:border-primary/40 hover:scale-105 transition-all duration-300 shadow-soft hover:shadow-glow"
                  >
                    <span className="text-2xl mr-3">{category.emoji}</span>
                    <span className="font-serif">{category.label}</span>
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 space-y-4"
          >
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-lg font-serif italic text-muted-foreground">
              Finding your perfect matches...
            </p>
          </motion.div>
        )}

        {!isLoading && recommendations.length > 0 && (
          <div className="space-y-6 py-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-serif text-primary">Your Recommendations</h3>
              <Button
                variant="ghost"
                onClick={() => setSelectedCategory(null)}
                className="text-sm"
              >
                ← Choose Different Mood
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((book, index) => (
                <RecommendationCard key={book.id} book={book} index={index} />
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RecommendationModal;
