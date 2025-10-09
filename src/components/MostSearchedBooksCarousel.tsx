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
import { TrendingUp } from "lucide-react";

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

      if (error) {
        console.error('Error fetching views:', error);
        setLoading(false);
        return;
      }

      // Count views per book
      const viewCounts = viewData.reduce((acc, view) => {
        acc[view.book_id] = (acc[view.book_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Get top 6 book IDs
      const topBookIds = Object.entries(viewCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
        .map(([id]) => id);

      if (topBookIds.length === 0) {
        // Fallback: show highest rated books if no views yet
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
    <section className="py-16 px-6 bg-gradient-to-b from-background to-dusty-rose/10">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <TrendingUp className="w-8 h-8 text-primary" />
            <h2 className="text-4xl md:text-5xl font-serif text-primary">
              Most Searched Books
            </h2>
          </div>
          <p className="text-lg text-muted-foreground italic">
            What romance readers are discovering right now
          </p>
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
      </div>
    </section>
  );
};

export default MostSearchedBooksCarousel;
