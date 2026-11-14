import { Heart, ArrowUpRight, Eye, X, Users } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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
    trope?: string | null;
    reader_count?: number;
  };
}

const BookCard = ({ book }: BookCardProps) => {
  const [peek, setPeek] = useState(false);
  const rating = book.rating ? Math.round(Number(book.rating)) : 0;

  return (
    <motion.div className="group relative"
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
      <div className="absolute left-2 top-2 z-30"><SaveBookButton bookId={book.id} title={book.title} heart /></div>
      <Button size="icon" variant="secondary" aria-label={`Quick peek at ${book.title}`} className="absolute bottom-28 right-2 z-30 h-8 w-8 rounded-full" onClick={() => setPeek(!peek)}><Eye className="h-4 w-4" /></Button>
      <div className={`absolute inset-x-0 top-0 z-20 flex aspect-[2/3] flex-col justify-end rounded-md bg-background/95 p-3 transition-opacity duration-200 ${peek ? "opacity-100" : "pointer-events-none opacity-0 md:group-hover:pointer-events-auto md:group-hover:opacity-100"}`}>
        <Button size="icon" variant="ghost" aria-label="Close quick peek" className="absolute right-1 top-1 h-7 w-7" onClick={() => setPeek(false)}><X className="h-4 w-4" /></Button>
        <p className="mb-2 font-serif text-lg font-semibold leading-tight line-clamp-3">{book.title}</p>
        <div className="mb-2 space-y-1">{(book.trope ?? "").split(/[;,]/).filter(Boolean).slice(0,2).map(t => <p key={t} className="text-xs text-muted-foreground">{t.trim()}</p>)}</div>
        <HeatLevelBadge heatLevel={book.heat_level ?? null} size="sm" />
        {typeof book.reader_count === "number" && <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><Users className="h-3 w-3" />{book.reader_count} readers explored this book</p>}
        <div className="mt-3 flex items-center justify-between gap-2"><SaveBookButton bookId={book.id} title={book.title} heart /><Button size="sm" variant="outline" asChild><Link to={`/book/${book.id}`}>View book</Link></Button></div>
      </div>
    </motion.div>
  );
};

export default BookCard;
