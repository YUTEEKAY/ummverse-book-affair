import { Heart, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import BookCover from "./BookCover";
import HeatLevelBadge from "./HeatLevelBadge";
import { SaveBookButton } from "./SaveBookButton";

interface BookCardProps {
  book: {
    id: string;
    title: string;
    author: string;
    cover_url: string | null;
    isbn?: string | null;
    isbn13?: string | null;
    rating: number | null;
    genre?: string | null;
    mood?: string | null;
    heat_level?: string | null;
  };
}

const BookCard = ({ book }: BookCardProps) => {
  const rating = book.rating ? Math.round(Number(book.rating)) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Link
        to={`/book/${book.id}`}
        className="group relative block overflow-hidden rounded-md bg-card transition duration-300 hover:-translate-y-1 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <div className="relative aspect-[2/3] overflow-hidden bg-secondary">
          <BookCover book={book} className="group-hover:scale-105 transition-transform duration-300" />
          <div className="absolute top-2 left-2 z-10">
            <SaveBookButton bookId={book.id} title={book.title} />
          </div>
          {book.heat_level && (
            <div className="absolute top-2 right-2 z-10">
              <HeatLevelBadge heatLevel={book.heat_level} size="sm" showLabel={false} />
            </div>
          )}
        </div>
        <div className="p-3 sm:p-4">
          <div className="mb-1 flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 font-serif text-lg font-semibold leading-tight text-foreground transition-colors group-hover:text-primary">
            {book.title}
          </h3>
          <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </div>
          <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{book.author}</p>
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
      </Link>
    </motion.div>
  );
};

export default BookCard;
