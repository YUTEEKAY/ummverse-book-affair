import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import BookCoverPlaceholder from "./BookCoverPlaceholder";
import HeatLevelBadge from "./HeatLevelBadge";

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

interface RecommendationCardProps {
  book: BookRecommendation;
  index: number;
}

const RecommendationCard = ({ book, index }: RecommendationCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className="group relative flex flex-col h-full"
    >
      {/* Cover Image */}
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 shadow-card">
        {book.cover_url ? (
          <img 
            src={book.cover_url} 
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <BookCoverPlaceholder 
            title={book.title} 
            genre={book.genre}
            mood={book.mood}
          />
        )}
        {book.heat_level && (
          <div className="absolute top-2 right-2">
            <HeatLevelBadge heatLevel={book.heat_level} size="sm" />
          </div>
        )}
      </div>

      {/* Book Info */}
      <div className="flex flex-col flex-1">
        <h3 className="font-serif font-semibold text-lg line-clamp-1 mb-1">
          {book.title}
        </h3>
        <p className="text-sm text-muted-foreground mb-3">
          {book.author}
        </p>
        
        {/* Why You'll Love It */}
        <div className="mb-4 p-3 bg-gradient-to-br from-blush/20 to-primary/10 rounded-lg border border-primary/20 backdrop-blur-sm flex-1">
          <p className="text-xs font-semibold text-primary mb-1.5 flex items-center gap-1">
            💕 Why You'll Love It
          </p>
          <p className="text-sm italic text-foreground/90 leading-relaxed">
            {book.whyYouLlLoveIt}
          </p>
        </div>

        {/* CTA Button */}
        <Button 
          asChild 
          className="w-full bg-gradient-romance text-white hover:scale-105 transition-all duration-300 shadow-soft hover:shadow-glow"
        >
          <Link to={`/book/${book.id}`}>
            Read More 💞
          </Link>
        </Button>
      </div>
    </motion.div>
  );
};

export default RecommendationCard;
