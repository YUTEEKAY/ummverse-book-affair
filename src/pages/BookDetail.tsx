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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import BookCard from "@/components/BookCard";
import BookCoverPlaceholder from "@/components/BookCoverPlaceholder";
import { getThemeStyle } from "@/lib/themeGradients";

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
  affiliate_kobo: string | null;
}

interface Review {
  id: string;
  review_text: string;
  nickname: string | null;
  rating: number | null;
  created_at: string;
}

const BookDetail = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [book, setBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Review form state
  const [formRating, setFormRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [nickname, setNickname] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPetals, setShowPetals] = useState(false);

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
        setBook({ ...bookData, affiliate_kobo: null } as Book);

        // Fetch reviews (using old column names until migration is approved)
        const { data: reviewsData } = await supabase
          .from("reviews")
          .select("id, review_text, pen_name, hearts, timestamp")
          .eq("book_id", bookId)
          .order("timestamp", { ascending: false });

        if (reviewsData) {
          // Map old column names to new interface structure
          const mappedReviews = reviewsData.map(review => ({
            id: review.id,
            review_text: review.review_text,
            nickname: review.pen_name,
            rating: review.hearts,
            created_at: review.timestamp
          }));
          setReviews(mappedReviews);
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
            setRecommendations(recsData.map(book => ({ ...book, affiliate_kobo: null } as Book)));
          }
        }
      }

      setLoading(false);
    };

    fetchBookAndReviews();
  }, [bookId]);

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    const avg = sum / reviews.length;
    return Math.round(avg * 2) / 2; // Round to nearest 0.5
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formRating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a rating before submitting.",
        variant: "destructive"
      });
      return;
    }

    if (reviewText.trim().length < 10) {
      toast({
        title: "Review too short",
        description: "Please write at least 10 characters.",
        variant: "destructive"
      });
      return;
    }

    if (reviewText.length > 500) {
      toast({
        title: "Review too long",
        description: "Please keep your review under 500 characters.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await supabase.functions.invoke('submit-review', {
        body: {
          bookId,
          rating: formRating,
          review: reviewText.trim(),
          nickname: nickname.trim() || 'A Hopeless Romantic'
        }
      });

      if (response.error) {
        throw response.error;
      }

      // Success! Show rose petals animation
      setShowPetals(true);
      setTimeout(() => setShowPetals(false), 3000);

      // Reset form
      setFormRating(0);
      setReviewText("");
      setNickname("");

      // Refresh reviews
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select("id, review_text, pen_name, hearts, timestamp")
        .eq("book_id", bookId)
        .order("timestamp", { ascending: false });

      if (reviewsData) {
        // Map old column names to new interface structure
        const mappedReviews = reviewsData.map(review => ({
          id: review.id,
          review_text: review.review_text,
          nickname: review.pen_name,
          rating: review.hearts,
          created_at: review.timestamp
        }));
        setReviews(mappedReviews);
      }

      toast({
        title: "Thank you for sharing your thoughts! 🌹",
        description: "Your review has been posted."
      });
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast({
        title: "Couldn't submit review",
        description: error.message || "Something went wrong. Please try again. 🌹",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const averageRating = calculateAverageRating();

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
  const theme = getThemeStyle(book.genre?.toLowerCase() || book.mood?.toLowerCase() || "default");

  return (
    <main className={`min-h-screen relative bg-gradient-to-br ${theme.gradient}`}>
      {/* Subtle animated overlay */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <motion.div
          className="absolute -top-1/2 -left-1/4 w-full h-full rounded-full bg-background/30 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
      <div className="relative max-w-6xl mx-auto px-6 py-12 z-10">
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
                  <motion.img
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    src={book.cover_url}
                    alt={book.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // If image fails to load, hide it and show placeholder
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <BookCoverPlaceholder 
                    title={book.title} 
                    genre={book.genre} 
                    mood={book.mood}
                  />
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
            {(book.affiliate_harlequin || book.affiliate_amazon || book.affiliate_barnesnoble || book.affiliate_kobo) && (
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
                  {book.affiliate_kobo && (
                    <Button 
                      onClick={() => window.open(book.affiliate_kobo!, "_blank")}
                      variant="outline"
                      className="border-2 border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white transition-colors"
                    >
                      Read on Kobo 📖
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Rose Petal Animation */}
        {showPetals && (
          <div className="fixed inset-0 pointer-events-none z-50">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-3xl"
                initial={{ 
                  top: -50, 
                  left: `${Math.random() * 100}%`,
                  rotate: 0,
                  opacity: 1
                }}
                animate={{ 
                  top: '100vh', 
                  rotate: 360,
                  opacity: 0
                }}
                transition={{ 
                  duration: 3 + Math.random() * 2,
                  delay: Math.random() * 0.5,
                  ease: "easeIn"
                }}
              >
                🌹
              </motion.div>
            ))}
          </div>
        )}

        <Separator className="my-12" />

        {/* Review Form Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <Card className="p-6 md:p-8 bg-gradient-to-br from-blush/10 to-dusty-rose/10 border-none shadow-soft rounded-2xl">
            <h2 className="text-2xl font-serif font-semibold mb-6 text-foreground">
              ✨ Share Your Thoughts
            </h2>
            
            <form onSubmit={handleSubmitReview} className="space-y-6">
              {/* Rating Selector */}
              <div>
                <Label className="text-base mb-3 block">⭐ Rating</Label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary rounded"
                    >
                      <Heart
                        className={`w-10 h-10 ${
                          star <= (hoverRating || formRating)
                            ? "fill-dusty-rose text-dusty-rose"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    </button>
                  ))}
                  {formRating > 0 && (
                    <span className="ml-2 text-muted-foreground font-medium">
                      {formRating}/5
                    </span>
                  )}
                </div>
              </div>

              {/* Review Text */}
              <div>
                <Label htmlFor="review-text" className="text-base mb-3 block">
                  💬 Your Review
                </Label>
                <Textarea
                  id="review-text"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share what you loved about this book..."
                  className="min-h-[120px] resize-none border-2 focus:border-dusty-rose"
                  maxLength={500}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  {reviewText.length}/500 characters
                </p>
              </div>

              {/* Nickname */}
              <div>
                <Label htmlFor="nickname" className="text-base mb-3 block">
                  🕊️ Nickname (optional)
                </Label>
                <Input
                  id="nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="A Hopeless Romantic"
                  className="border-2 focus:border-dusty-rose"
                  maxLength={50}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full md:w-auto bg-dusty-rose hover:bg-dusty-rose/90 text-white font-serif text-lg px-8"
              >
                {isSubmitting ? "Submitting..." : "Submit Review ✨"}
              </Button>
            </form>
          </Card>
        </motion.div>

        {/* Reviews Section */}
        {reviews.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-serif font-semibold">💕 Reader Reviews</h2>
              {averageRating > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Heart className="w-6 h-6 fill-dusty-rose text-dusty-rose" />
                    <span className="text-2xl font-serif font-bold">
                      {averageRating.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-muted-foreground">
                    Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                  </span>
                </div>
              )}
            </div>
            <div className="space-y-6">
              {reviews.map((review) => (
                <Card key={review.id} className="p-6">
                  <div className="flex items-start justify-between mb-3">
                  <div>
                      <p className="font-semibold text-foreground">
                        {review.nickname || "Anonymous Reader"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    {review.rating && review.rating > 0 && (
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Heart
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating!
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
