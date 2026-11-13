import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import BookCard from "@/components/BookCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import { motion } from "framer-motion";
import DiscoverButton from "@/components/DiscoverButton";
import HeatLevelFilter from "@/components/HeatLevelFilter";
import type { HeatLevel } from "@/lib/heatLevelConfig";

interface Trope {
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
  isbn?: string | null;
  isbn13?: string | null;
  rating: number | null;
  heat_level: string | null;
}

const TropeDetail = () => {
  const { tropeId } = useParams<{ tropeId: string }>();
  const navigate = useNavigate();
  const [trope, setTrope] = useState<Trope | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedHeatLevel, setSelectedHeatLevel] = useState<HeatLevel | "all">("all");

  useEffect(() => {
    const fetchTropeAndBooks = async () => {
      if (!tropeId) return;

      setIsLoading(true);

      try {
        // Fetch trope details
        const { data: tropeData, error: tropeError } = await supabase
          .from("tropes")
          .select("*")
          .eq("id", tropeId)
          .single();

        if (tropeError) throw tropeError;

        if (tropeData) {
          setTrope(tropeData);

          // Fetch books matching this trope
          const { data: booksData, error: booksError } = await supabase
            .from("books")
            .select("id, title, author, cover_url, isbn, isbn13, rating, heat_level")
            .eq("trope", tropeData.name)
            .order("rating", { ascending: false, nullsFirst: false });

          if (booksError) throw booksError;

          if (booksData) {
            setAllBooks(booksData);
            setBooks(booksData);
          }
        }
      } catch (error) {
        console.error("Error fetching trope:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTropeAndBooks();
  }, [tropeId]);

  useEffect(() => {
    if (selectedHeatLevel === "all") {
      setBooks(allBooks);
    } else {
      setBooks(allBooks.filter((book) => book.heat_level === selectedHeatLevel));
    }
  }, [selectedHeatLevel, allBooks]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="font-serif text-2xl text-foreground"
        >
          Loading romance...
        </motion.div>
      </div>
    );
  }

  if (!trope) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <h1 className="text-4xl font-serif mb-4">Trope Not Found</h1>
          <Button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Return Home clicked');
              navigate("/");
            }} 
            variant="outline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  const tropeFields: Record<string, string> = {
    hot: "editorial-field--hot",
    warm: "editorial-field--warm",
    mystical: "editorial-field--mystical",
    dark: "editorial-field--dark",
    soft: "editorial-field--soft",
    bright: "editorial-field--bright",
    contemporary: "editorial-field--contemporary",
    regal: "editorial-field--regal",
    default: "editorial-field--default",
  };
  const fieldClass = tropeFields[trope.color_theme || ""] || tropeFields.default;

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
      <SiteHeader />
      {/* Hero Section with Motion Background */}
      <section className={`relative overflow-hidden px-4 py-16 text-primary-foreground sm:py-20 ${fieldClass}`}>
        <div className="container relative z-10 mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Back to Home clicked');
                navigate("/");
              }}
              variant="ghost"
              className="relative z-20 mb-8 text-primary-foreground hover:bg-primary-foreground/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-4 font-serif text-5xl font-semibold text-primary-foreground sm:text-6xl"
          >
            {trope.name}
          </motion.h1>

          {trope.description && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="max-w-2xl font-serif text-xl italic text-primary-foreground/80 sm:text-2xl"
            >
              {trope.description}
            </motion.p>
          )}
        </div>
      </section>

      {/* Books Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          {allBooks.length > 0 && (
            <HeatLevelFilter
              selectedLevel={selectedHeatLevel}
              onSelectLevel={setSelectedHeatLevel}
            />
          )}
          
          <h2 className="text-3xl font-serif font-bold mb-8">
            {books.length} {books.length === 1 ? "Book" : "Books"} Found
          </h2>

          {allBooks.length > 0 ? (
            books.length > 0 ? (
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
              <div className="text-center py-12">
                <p className="text-xl text-muted-foreground mb-4">
                  No books found with this heat level.
                </p>
                <Button
                  onClick={() => setSelectedHeatLevel("all")}
                  variant="outline"
                >
                  Show All Books
                </Button>
              </div>
            )
          ) : (
            <div className="text-center py-16">
              <p className="text-xl text-muted-foreground mb-6">
                No books found with this trope yet.
              </p>
              <Button onClick={() => navigate("/")}>
                Explore Other Tropes
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
            <DiscoverButton currentId={tropeId!} currentType="trope" />
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default TropeDetail;
