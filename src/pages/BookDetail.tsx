import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Heart, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { getThemeStyle } from "@/lib/themeGradients";
import BookCoverPlaceholder from "@/components/BookCoverPlaceholder";
import HeatLevelBadge from "@/components/HeatLevelBadge";
import { getHeatLevelConfig } from "@/lib/heatLevelConfig";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import SimilarBooksSection from "@/components/SimilarBooksSection";
import { useAuth } from "@/contexts/AuthContext";
import { useBookEnrichment } from "@/hooks/useBookEnrichment";

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
  const { isAdmin } = useAuth();
  const { enrichBook } = useBookEnrichment();
  const [book, setBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Review form state
  const [formRating, setFormRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [nickname, setNickname] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPetals, setShowPetals] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);

  useEffect(() => {
    const fetchBookAndReviews = async () => {
      if (!bookId) return;

      setLoading(true);

      const { data: bookData } = await supabase
        .from("books")
        .select("id, title, author, cover_url, rating, summary, genre, mood, trope, heat_level, publication_year")
        .eq("id", bookId)
        .single();

      if (bookData) {
        setBook(bookData as Book);
        
        // Track book view (anonymous)
        await supabase.from('book_views').insert({
          book_id: bookId,
          user_id: null,
          view_type: 'detail_page'
        });

        // Fetch reviews
        const { data: reviewsData } = await supabase
          .from("reviews")
          .select("id, review_text, pen_name, hearts, timestamp")
          .eq("book_id", bookId)
          .order("timestamp", { ascending: false });

        if (reviewsData) {
          const mappedReviews = reviewsData.map(review => ({
            id: review.id,
            review_text: review.review_text,
            nickname: review.pen_name,
            rating: review.hearts,
            created_at: review.timestamp
          }));
          setReviews(mappedReviews);
        }
      }

      setLoading(false);
    };

    fetchBookAndReviews();
  }, [bookId]);

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + (review.rating || 0), 0);
    return Math.round(sum / reviews.length);
  };

  const handleSubmitReview = async () => {
    if (!formRating) {
      toast({
        title: "Rating required",
        description: "Please select a rating",
        variant: "destructive",
      });
      return;
    }

    if (!reviewText || reviewText.length < 10) {
      toast({
        title: "Review too short",
        description: "Please write at least 10 characters",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke('submit-review', {
        body: {
          bookId,
          rating: formRating,
          review: reviewText,
          nickname: nickname || 'Anonymous'
        }
      });

      if (error) throw error;

      // Show success animation
      setShowPetals(true);
      setTimeout(() => setShowPetals(false), 3000);

      toast({
        title: "Review submitted!",
        description: "Thank you for sharing your thoughts 💕",
      });

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
        const mappedReviews = reviewsData.map(review => ({
          id: review.id,
          review_text: review.review_text,
          nickname: review.pen_name,
          rating: review.hearts,
          created_at: review.timestamp
        }));
        setReviews(mappedReviews);
      }

    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnrichBook = async () => {
    if (!bookId) return;
    
    setIsEnriching(true);
    await enrichBook(bookId);
    setIsEnriching(false);
    
    // Reload book data
    const { data: bookData } = await supabase
      .from("books")
      .select("*")
      .eq("id", bookId)
      .single();
    
    if (bookData) {
      setBook(bookData as Book);
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
          <Button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate("/");
            }}
          >
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  const rating = book.rating ? Math.round(Number(book.rating)) : 0;
  const themeStyle = getThemeStyle(book?.genre || book?.mood);
  const heatConfig = getHeatLevelConfig(book?.heat_level);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Heat level background glow */}
      {heatConfig && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: heatConfig.bgGlow,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        />
      )}

      <div className="relative max-w-6xl mx-auto px-6 py-12 z-10">
        <div className="flex items-center justify-between mb-8 relative z-20">
          <Button
            type="button"
            variant="ghost"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(-1);
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          {isAdmin && (
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleEnrichBook();
              }}
              disabled={isEnriching}
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isEnriching ? 'animate-spin' : ''}`} />
              Refresh Book Data
            </Button>
          )}
        </div>

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
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-4xl md:text-5xl font-serif font-bold flex-1"
                >
                  {book.title}
                </motion.h1>
                {book.heat_level && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <HeatLevelBadge heatLevel={book.heat_level} size="lg" />
                  </motion.div>
                )}
              </div>
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
                <h2 className="text-2xl font-serif font-semibold mb-3 flex items-center gap-2">
                  Summary
                  <Heart className="w-5 h-5 text-dusty-rose fill-dusty-rose" />
                </h2>
                <p className="text-muted-foreground leading-relaxed">{book.summary}</p>
              </div>
            )}
          </div>
        </motion.div>

        <Separator className="my-12" />

        {/* Submit Review - Open to everyone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <Card className="p-6 md:p-8 bg-card/80 backdrop-blur-sm">
            <h3 className="text-2xl font-serif font-semibold mb-6">Share Your Review</h3>
            
            <div className="space-y-6">
              {/* Star Rating */}
              <div>
                <Label className="text-base mb-3 block">Your Rating</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Heart
                        className={`w-8 h-8 transition-colors ${
                          star <= (hoverRating || formRating)
                            ? "fill-dusty-rose text-dusty-rose"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Nickname */}
              <div>
                <Label htmlFor="nickname" className="text-base mb-2 block">
                  Your Name (optional)
                </Label>
                <Input
                  id="nickname"
                  placeholder="Anonymous"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="max-w-xs"
                />
              </div>

              {/* Review Text */}
              <div>
                <Label htmlFor="review" className="text-base mb-2 block">
                  Your Review
                </Label>
                <Textarea
                  id="review"
                  placeholder="Share your thoughts about this book..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>

              <Button
                onClick={handleSubmitReview}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-primary to-dusty-rose"
              >
                {isSubmitting ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Existing Reviews */}
        {reviews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-12"
          >
            <h3 className="text-2xl font-serif font-semibold mb-6 flex items-center gap-2">
              Reader Reviews
              <span className="text-base font-normal text-muted-foreground">
                ({reviews.length})
              </span>
            </h3>

            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id} className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium">{review.nickname || "Anonymous"}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {review.rating && (
                      <div className="flex gap-1">
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
                  <p className="text-muted-foreground">{review.review_text}</p>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Similar Books */}
        <SimilarBooksSection 
          contextType="book" 
          contextId={bookId!} 
          contextData={{
            title: book.title,
            genre: book.genre,
            mood: book.mood,
            trope: book.trope,
            heat_level: book.heat_level
          }}
        />
      </div>

      {/* Petal animation on successful review */}
      <AnimatePresence>
        {showPetals && (
          <div className="fixed inset-0 pointer-events-none z-50">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-2xl"
                initial={{
                  top: "-10%",
                  left: `${Math.random() * 100}%`,
                  rotate: 0,
                }}
                animate={{
                  top: "110%",
                  rotate: 360,
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  delay: Math.random() * 0.5,
                  ease: "linear",
                }}
              >
                🌸
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookDetail;
