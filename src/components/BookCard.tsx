import { Card } from "@/components/ui/card";
import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import BookCoverPlaceholder from "./BookCoverPlaceholder";
import HeatLevelBadge from "./HeatLevelBadge";

interface BookCardProps {
  book: {
    id: string;
    title: string;
    author: string;
    cover_url: string | null;
    rating: number | null;
    genre?: string | null;
    mood?: string | null;
    heat_level?: string | null;
  };
}

const BookCard = ({ book }: BookCardProps) => {
  const navigate = useNavigate();
  const rating = book.rating ? Math.round(Number(book.rating)) : 0;
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card
        onClick={() => navigate(`/book/${book.id}`)}
        className="group relative overflow-hidden rounded-2xl shadow-soft hover:shadow-glow transition-all duration-300 cursor-pointer border-none bg-card"
      >
        <div className="aspect-[2/3] relative overflow-hidden bg-gradient-to-br from-blush/20 to-dusty-rose/20">
          {book.cover_url && !imageError ? (
            <>
              {!imageLoaded && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-muted via-muted-foreground/20 to-muted"
                  animate={{
                    backgroundPosition: ['-200%', '200%']
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  style={{
                    backgroundSize: '200% 100%'
                  }}
                />
              )}
              <motion.img
                initial={{ opacity: 0 }}
                animate={{ opacity: imageLoaded ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                src={book.cover_url}
                alt={book.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  setImageError(true);
                  setImageLoaded(true);
                }}
              />
            </>
          ) : (
            <BookCoverPlaceholder 
              title={book.title} 
              genre={book.genre} 
              mood={book.mood}
            />
          )}
          {book.heat_level && (
            <div className="absolute top-2 right-2 z-10">
              <HeatLevelBadge heatLevel={book.heat_level} size="sm" showLabel={false} />
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-serif text-lg font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {book.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{book.author}</p>
          {rating > 0 && (
            <div className="flex items-center gap-1 mt-2">
              {[...Array(5)].map((_, i) => (
                <Heart
                  key={i}
                  className={`w-4 h-4 ${
                    i < rating
                      ? "fill-dusty-rose text-dusty-rose"
                      : "text-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default BookCard;
