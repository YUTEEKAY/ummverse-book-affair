import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Heart } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { motion } from "framer-motion";

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

  const getHeartRating = (rating: number | null) => {
    if (!rating) return 0;
    return Math.round(rating);
  };

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
            {books.map((book, index) => (
              <CarouselItem
                key={book.id}
                className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="group overflow-hidden rounded-2xl shadow-soft hover:shadow-card transition-all duration-300 cursor-pointer border-dusty-rose/20 bg-card/80 backdrop-blur-sm">
                    <div className="aspect-[2/3] relative overflow-hidden bg-gradient-romance">
                      {book.cover_url ? (
                        <img
                          src={book.cover_url}
                          alt={book.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Heart className="w-16 h-16 text-white/50 fill-white/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <div className="p-4 space-y-2">
                      <h3 className="text-lg font-serif font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                        {book.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {book.author}
                      </p>

                      <div className="flex items-center gap-1 pt-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Heart
                            key={i}
                            className={`w-4 h-4 ${
                              i < getHeartRating(book.rating)
                                ? "text-primary fill-primary"
                                : "text-muted stroke-muted"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </Card>
                </motion.div>
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
