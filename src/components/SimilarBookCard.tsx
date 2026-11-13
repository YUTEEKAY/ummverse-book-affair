import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import BookCover from "@/components/BookCover";
import HeatLevelBadge from "@/components/HeatLevelBadge";
interface BookRecommendation {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  genre: string | null;
  mood: string | null;
  heat_level: string | null;
  poeticLine: string;
}
interface SimilarBookCardProps {
  book: BookRecommendation;
}
const SimilarBookCard = ({
  book
}: SimilarBookCardProps) => {
  return <Link to={`/book/${book.id}`} className="group block">
      <motion.div whileHover={{
      scale: 1.03
    }} transition={{
      duration: 0.2
    }} className="relative">
        {/* Cover */}
        <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 shadow-card bg-secondary">
          <BookCover book={book} className="group-hover:scale-105 transition-transform duration-500" />
          {book.heat_level && <div className="absolute top-2 right-2">
              <HeatLevelBadge heatLevel={book.heat_level} size="sm" />
            </div>}
        </div>
        
        {/* Book Info */}
        <h3 className="font-serif font-semibold text-base line-clamp-2 mb-1">
          {book.title}
        </h3>
        <p className="text-sm text-muted-foreground mb-2 bg-[#c96391] text-cream">
          {book.author}
        </p>
        
        {/* Poetic Line */}
        <div className="mb-3 p-2 bg-gradient-to-br from-blush/10 to-primary/5 rounded-md border border-primary/10">
          <p className="text-xs italic text-foreground/80 line-clamp-2">
            {book.poeticLine}
          </p>
        </div>
        
        {/* CTA */}
        <Button size="sm" className="w-full bg-gradient-to-r from-primary to-primary/80 text-xs hover:shadow-glow transition-all text-blush">
          Discover 💕
        </Button>
      </motion.div>
    </Link>;
};
export default SimilarBookCard;