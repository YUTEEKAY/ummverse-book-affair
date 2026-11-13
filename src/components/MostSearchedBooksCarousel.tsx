import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { motion } from "framer-motion";
import BookCard from "@/components/BookCard";
import { ArrowRight, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

interface Book {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  rating: number | null;
  heat_level: string | null;
  view_count?: number;
}

const MostSearchedBooksCarousel = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMostViewed = async () => {
      // Query to get books with most views in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: viewData, error } = await supabase
        .from('book_views')
        .select('book_id')
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (error) console.error('Error fetching views:', error);

      // Count views per book
      const viewCounts = (viewData || []).reduce((acc, view) => {
        acc[view.book_id] = (acc[view.book_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Get top 6 book IDs
      const topBookIds = Object.entries(viewCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
        .map(([id]) => id);

      if (topBookIds.length === 0) {
        // Fallback: show highest rated books if no views are available yet.
        const { data: fallbackBooks } = await supabase
          .from('books')
          .select('id, title, author, cover_url, rating, heat_level')
          .order('rating', { ascending: false })
          .limit(6);

        setBooks(fallbackBooks || []);
        setLoading(false);
        return;
      }

      // Fetch book details
      const { data: booksData } = await supabase
        .from('books')
        .select('id, title, author, cover_url, rating, heat_level')
        .in('id', topBookIds);

      if (booksData) {
        // Sort books by view count
        const sortedBooks = booksData
          .map(book => ({
            ...book,
            view_count: viewCounts[book.id]
          }))
          .sort((a, b) => (b.view_count || 0) - (a.view_count || 0));

        setBooks(sortedBooks);
      }

      setLoading(false);
    };

    fetchMostViewed();
  }, []);

  if (loading || books.length === 0) return null;

  return (
    <section aria-labelledby="popular-books-title" className="px-6 py-14 sm:py-20">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-8 flex flex-col justify-between gap-3 sm:mb-10 sm:flex-row sm:items-end"
        >
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary"><TrendingUp className="h-4 w-4" /> Reader favorites</p>
            <h2 id="popular-books-title" className="font-serif text-4xl font-semibold text-foreground sm:text-5xl">One more chapter.</h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">Books readers are exploring right now.</p>
        </motion.div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {books.map((book) => (
              <CarouselItem
                key={book.id}
                className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
              >
                <BookCard book={book} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden md:block">
            <CarouselPrevious className="shadow-soft" />
            <CarouselNext className="shadow-soft" />
          </div>
        </Carousel>
        <div className="mt-7 flex justify-end">
          <Link to="/mood" className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-foreground">
            Browse all moods <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default MostSearchedBooksCarousel;
