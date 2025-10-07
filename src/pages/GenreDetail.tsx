import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import BookCard from "@/components/BookCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { getThemeStyle } from "@/lib/themeGradients";
import DiscoverButton from "@/components/DiscoverButton";

interface Genre {
  id: string;
  name: string;
  description: string | null;
  color_theme: string | null;
}

interface Book {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  rating: number | null;
}

const GenreDetail = () => {
  const { genreId } = useParams<{ genreId: string }>();
  const navigate = useNavigate();
  const [genre, setGenre] = useState<Genre | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGenreAndBooks = async () => {
      if (!genreId) return;

      setIsLoading(true);

      try {
        // Fetch genre details
        const { data: genreData, error: genreError } = await supabase
          .from("genres")
          .select("*")
          .eq("id", genreId)
          .single();

        if (genreError) throw genreError;

        if (genreData) {
          setGenre(genreData);

          // Fetch books matching this genre
          const { data: booksData, error: booksError } = await supabase
            .from("books")
            .select("id, title, author, cover_url, rating")
            .eq("genre", genreData.name)
            .order("rating", { ascending: false, nullsFirst: false });

          if (booksError) throw booksError;

          if (booksData) {
            setBooks(booksData);
          }
        }
      } catch (error) {
        console.error("Error fetching genre:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGenreAndBooks();
  }, [genreId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blush via-warm-peach to-dusty-rose">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-white text-2xl font-serif"
        >
          Loading romance...
        </motion.div>
      </div>
    );
  }

  if (!genre) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blush via-warm-peach to-dusty-rose">
        <div className="text-center text-white">
          <h1 className="text-4xl font-serif mb-4">Genre Not Found</h1>
          <Button onClick={() => navigate("/")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  const themeStyle = getThemeStyle(genre.color_theme);

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

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Motion Background */}
      <section className={`relative bg-gradient-to-br ${themeStyle.gradient} py-24 px-4 overflow-hidden`}>
        {/* Subtle motion background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
          <motion.div
            className="absolute -top-1/2 -left-1/4 w-full h-full rounded-full bg-white/20 blur-3xl"
            animate={{
              x: [0, 100, 0],
              y: [0, 50, 0],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute -bottom-1/2 -right-1/4 w-full h-full rounded-full bg-white/20 blur-3xl"
            animate={{
              x: [0, -100, 0],
              y: [0, -50, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
          />
        </div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Button
              onClick={() => navigate("/")}
              variant="ghost"
              className={`${themeStyle.textColor} hover:bg-white/20 mb-8`}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`text-5xl md:text-7xl font-serif font-bold ${themeStyle.textColor} mb-4`}
          >
            {genre.name}
          </motion.h1>

          {genre.description && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className={`text-xl md:text-2xl ${themeStyle.accentColor} font-serif italic max-w-2xl`}
            >
              {genre.description}
            </motion.p>
          )}
        </div>
      </section>

      {/* Books Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-serif font-bold mb-8">
            {books.length} {books.length === 1 ? "Book" : "Books"} Found
          </h2>

          {books.length > 0 ? (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            >
              {books.map((book) => (
                <motion.div key={book.id} variants={item}>
                  <BookCard book={book} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-16">
              <p className="text-xl text-muted-foreground mb-6">
                No books found in this genre yet.
              </p>
              <Button onClick={() => navigate("/")}>
                Explore Other Genres
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Discover CTA */}
      <section className="py-16 px-4 bg-gradient-to-br from-blush/10 via-warm-peach/10 to-dusty-rose/10">
        <div className="container mx-auto max-w-6xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-3xl font-serif font-bold mb-6">
              Ready for a new adventure?
            </h3>
            <DiscoverButton currentId={genreId!} currentType="genre" />
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default GenreDetail;
