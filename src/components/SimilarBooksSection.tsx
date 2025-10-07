import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import SimilarBookCard from "./SimilarBookCard";
import { Skeleton } from "./ui/skeleton";
import { getCachedRecommendations, setCachedRecommendations } from "@/lib/recommendationCache";

interface BookRecommendation {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  genre: string | null;
  mood: string | null;
  trope: string | null;
  heat_level: string | null;
  poeticLine: string;
}

interface SimilarBooksSectionProps {
  contextType: 'genre' | 'mood' | 'book';
  contextId: string;
  contextData: {
    title?: string;
    name?: string;
    genre?: string | null;
    mood?: string | null;
    trope?: string | null;
    heat_level?: string | null;
  };
  limit?: number;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const SimilarBooksSection = ({ 
  contextType, 
  contextId, 
  contextData, 
  limit = 4 
}: SimilarBooksSectionProps) => {
  const [recommendations, setRecommendations] = useState<BookRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const fetchRecommendations = async () => {
      // Check sessionStorage cache first
      const cached = getCachedRecommendations(contextType, contextId);
      
      if (cached) {
        setRecommendations(cached);
        return;
      }
      
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase.functions.invoke('get-similar-books', {
          body: {
            contextType,
            contextId,
            currentBookData: contextType === 'book' ? {
              title: contextData.title,
              genre: contextData.genre,
              mood: contextData.mood,
              trope: contextData.trope,
              heat_level: contextData.heat_level
            } : undefined,
            limit
          }
        });
        
        if (error) throw error;
        
        if (data?.recommendations) {
          setRecommendations(data.recommendations);
          // Cache in sessionStorage
          setCachedRecommendations(contextType, contextId, data.recommendations);
        }
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRecommendations();
  }, [contextType, contextId, contextData, limit]);
  
  if (isLoading) {
    return (
      <section className="py-8">
        <h2 className="text-3xl font-serif font-semibold mb-6">
          Finding similar books...
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(limit)].map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] rounded-xl" />
          ))}
        </div>
      </section>
    );
  }
  
  if (recommendations.length === 0) {
    return null;
  }
  
  const sectionTitle = {
    book: "You Might Also Love",
    genre: `More ${contextData.name} Romances`,
    mood: `More Books for This Mood`
  }[contextType];
  
  return (
    <section className="py-8">
      <h2 className="text-3xl font-serif font-semibold mb-6 flex items-center gap-2">
        {sectionTitle} 💕
      </h2>
      
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
      >
        {recommendations.map((book) => (
          <motion.div key={book.id} variants={item}>
            <SimilarBookCard book={book} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};

export default SimilarBooksSection;
