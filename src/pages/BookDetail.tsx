import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import BookCard from "@/components/BookCard";

interface Book {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  rating: number | null;
  summary: string | null;
  heat_level: string | null;
  genre: string | null;
  trope: string | null;
  mood: string | null;
  purchase_link: string | null;
  publication_year: number | null;
  affiliate_harlequin: string | null;
  affiliate_amazon: string | null;
  affiliate_barnesnoble: string | null;
}

interface Review {
  id: string;
  review_text: string;
  pen_name: string | null;
  hearts: number | null;
  timestamp: string;
}

const BookDetail = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookAndReviews = async () => {
      if (!bookId) return;

      setLoading(true);

      // Fetch book details
      const { data: bookData } = await supabase
        .from("books")
        .select("*")
        .eq("id", bookId)
        .single();

      if (bookData) {
        setBook(bookData);

        // Fetch reviews
        const { data: reviewsData } = await supabase
          .from("reviews")
          .select("*")
          .eq("book_id", bookId)
          .order("timestamp", { ascending: false });

        if (reviewsData) {
          setReviews(reviewsData);
        }

        // Fetch recommendations based on mood or trope
        if (bookData.mood || bookData.trope) {
          const { data: recsData } = await supabase
            .from("books")
            .select("*")
            .neq("id", bookId)
            .or(`mood.eq.${bookData.mood},trope.eq.${bookData.trope}`)
            .limit(6);
            
          if (recsData) {
            setRecommendations(recsData);
          }
        }
      }

      setLoading(false);
    };

    fetchBookAndReviews();
  }, [bookId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <Skeleton className="h-10 w-32 mb-8" />
          <div className="grid md:grid-cols-3 gap-8">
            <Skeleton className="aspect-[2/3] rounded-2xl" />
            <div className="md:col-span-2 space-y-4">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-serif text-foreground mb-4">Book not found</h2>
          <Button onClick={() => navigate("/")}>Return Home</Button>
        </div>
      </div>
    );
  }

  const rating = book.rating ? Math.round(Number(book.rating)) : 0;

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid md:grid-cols-3 gap-8 mb-12"
        >
          {/* Book Cover */}
          <div className="md:col-span-1">
            <Card className="overflow-hidden rounded-2xl shadow-glow border-none">
              <div className="aspect-[2/3] relative bg-gradient-to-br from-blush/20 to-dusty-rose/20">
                {book.cover_url ? (
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-muted-foreground text-lg italic">No cover available</span>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Book Details */}
          <div className="md:col-span-2">
            <div className="relative inline-block mb-2">
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground">
                {book.title}
              </h1>
              {/* Floating hearts animation */}
              <motion.div
                className="absolute -top-6 -right-8 text-2xl"
                animate={{ 
                  y: [-5, 5, -5],
                  rotate: [0, 5, -5, 0] 
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 3,
                  ease: "easeInOut"
                }}
              >
                ❤️
              </motion.div>
              <motion.div
                className="absolute -bottom-2 -left-6 text-xl opacity-70"
                animate={{ 
                  y: [5, -5, 5],
                  rotate: [0, -5, 5, 0] 
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 3.5,
                  ease: "easeInOut",
                  delay: 0.5
                }}
              >
                🌹
              </motion.div>
            </div>
            <p className="text-xl text-muted-foreground mb-2">by {book.author}</p>
            {book.publication_year && (
              <p className="text-lg text-muted-foreground mb-4">
                Published: {book.publication_year}
              </p>
            )}

            {/* Rating */}
            {rating > 0 && (
              <div className="flex items-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Heart
                    key={i}
                    className={`w-6 h-6 ${
                      i < rating
                        ? "fill-dusty-rose text-dusty-rose"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
                <span className="ml-2 text-muted-foreground">({rating}/5)</span>
              </div>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {book.genre && <Badge variant="secondary">{book.genre}</Badge>}
              {book.mood && <Badge variant="outline">{book.mood}</Badge>}
              {book.heat_level && <Badge className="bg-dusty-rose text-white">{book.heat_level}</Badge>}
              {book.trope && <Badge variant="secondary">{book.trope}</Badge>}
            </div>

            {/* Summary */}
            {book.summary && (
              <div className="mb-6">
                <h2 className="text-2xl font-serif font-semibold mb-3">Summary</h2>
                <p className="text-muted-foreground leading-relaxed">{book.summary}</p>
              </div>
            )}

            {/* Affiliate Links */}
            {(book.affiliate_harlequin || book.affiliate_amazon || book.affiliate_barnesnoble) && (
              <div className="space-y-4">
                <h3 className="text-xl font-serif font-semibold">Get Your Copy</h3>
                <div className="flex flex-wrap gap-3">
                  {book.affiliate_harlequin && (
                    <Button 
                      onClick={() => window.open(book.affiliate_harlequin!, "_blank")}
                      variant="outline"
                      className="border-2 border-dusty-rose text-dusty-rose hover:bg-dusty-rose hover:text-white transition-colors"
                    >
                      Read on Harlequin 💋
                    </Button>
                  )}
                  {book.affiliate_amazon && (
                    <Button 
                      onClick={() => window.open(book.affiliate_amazon!, "_blank")}
                      variant="outline"
                      className="border-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors"
                    >
                      Amazon 📚
                    </Button>
                  )}
                  {book.affiliate_barnesnoble && (
                    <Button 
                      onClick={() => window.open(book.affiliate_barnesnoble!, "_blank")}
                      variant="outline"
                      className="border-2 border-accent text-accent hover:bg-accent hover:text-white transition-colors"
                    >
                      Barnes & Noble 💕
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Reviews Section */}
        {reviews.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Separator className="mb-8" />
            <h2 className="text-3xl font-serif font-semibold mb-6">Reader Reviews</h2>
            <div className="space-y-6">
              {reviews.map((review) => (
                <Card key={review.id} className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-foreground">
                        {review.pen_name || "Anonymous Reader"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(review.timestamp).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    {review.hearts && review.hearts > 0 && (
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Heart
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.hearts!
                                ? "fill-dusty-rose text-dusty-rose"
                                : "text-muted-foreground/30"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{review.review_text}</p>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* You Might Also Like Section */}
        {recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12"
          >
            <Separator className="mb-8" />
            <h2 className="text-3xl font-serif font-semibold mb-6">
              You Might Also Like
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {recommendations.map((recBook) => (
                <BookCard key={recBook.id} book={recBook} />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
};

export default BookDetail;
