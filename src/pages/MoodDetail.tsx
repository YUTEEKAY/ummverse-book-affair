import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import BookCard from "@/components/BookCard";
import { Skeleton } from "@/components/ui/skeleton";

interface Mood {
  id: string;
  name: string;
  tagline: string | null;
  color_theme: string | null;
}

interface Book {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  rating: number | null;
}

const moodGradients: Record<string, string> = {
  warm: "from-warm-peach via-blush to-dusty-rose",
  hot: "from-red-400 via-orange-400 to-yellow-400",
  mystical: "from-purple-400 via-blue-400 to-indigo-400",
  regal: "from-purple-900 via-red-900 to-amber-700",
  default: "from-blush via-dusty-rose to-warm-peach",
};

const MoodDetail = () => {
  const { moodId } = useParams();
  const navigate = useNavigate();
  const [mood, setMood] = useState<Mood | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMoodAndBooks = async () => {
      if (!moodId) return;

      setLoading(true);

      // Fetch mood details
      const { data: moodData } = await supabase
        .from("moods")
        .select("*")
        .eq("id", moodId)
        .single();

      if (moodData) {
        setMood(moodData);

        // Fetch books matching this mood name
        const { data: booksData } = await supabase
          .from("books")
          .select("id, title, author, cover_url, rating")
          .eq("mood", moodData.name)
          .order("rating", { ascending: false, nullsFirst: false });

        if (booksData) {
          setBooks(booksData);
        }
      }

      setLoading(false);
    };

    fetchMoodAndBooks();
  }, [moodId]);

  const gradientClass = mood?.color_theme
    ? moodGradients[mood.color_theme] || moodGradients.default
    : moodGradients.default;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className={`bg-gradient-to-br ${gradientClass} py-20 px-6`}>
          <div className="max-w-6xl mx-auto">
            <Skeleton className="h-10 w-32 mb-8" />
            <Skeleton className="h-16 w-64 mb-4" />
            <Skeleton className="h-6 w-96" />
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!mood) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-serif text-foreground mb-4">Mood not found</h2>
          <Button onClick={() => navigate("/")}>Return Home</Button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className={`bg-gradient-to-br ${gradientClass} py-20 px-6 relative`}
      >
        <div className="max-w-6xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-8 text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-6xl font-serif font-bold text-white mb-4"
          >
            {mood.name}
          </motion.h1>
          {mood.tagline && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl text-white/90 italic"
            >
              {mood.tagline}
            </motion.p>
          )}
        </div>
      </motion.div>

      {/* Books Grid */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {books.length > 0 ? (
          <>
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-3xl font-serif text-foreground mb-8"
            >
              {books.length} {books.length === 1 ? "Book" : "Books"} Found
            </motion.h2>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            >
              {books.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </motion.div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center py-20"
          >
            <h2 className="text-2xl font-serif text-muted-foreground mb-4">
              No books found for this mood yet
            </h2>
            <p className="text-muted-foreground mb-8">
              Check back soon as we add more titles!
            </p>
            <Button onClick={() => navigate("/")}>Explore Other Moods</Button>
          </motion.div>
        )}
      </div>
    </main>
  );
};

export default MoodDetail;
