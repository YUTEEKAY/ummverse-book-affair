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
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-2">
              {book.title}
            </h1>
            <p className="text-xl text-muted-foreground mb-4">by {book.author}</p>

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

            {/* Purchase Link */}
            {book.purchase_link && (
              <Button
                onClick={() => window.open(book.purchase_link!, "_blank")}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Get This Book
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
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
      </div>
    </main>
  );
};

export default BookDetail;
