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

interface Book {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  rating: number | null;
}

const TrendingBooksCarousel = () => {
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    const fetchBooks = async () => {
      const { data } = await supabase
        .from("books")
        .select("id, title, author, cover_url, rating")
        .order("rating", { ascending: false })
        .limit(6);

      if (data) {
        setBooks(data);
      }
    };

    fetchBooks();
  }, []);

  if (books.length === 0) return null;

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
          <h2 className="text-4xl md:text-5xl font-serif text-primary mb-4">
            Trending Reads
          </h2>
          <p className="text-lg text-muted-foreground italic">
            The most loved books right now
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

export default TrendingBooksCarousel;
