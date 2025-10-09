import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Heart, Lock, RefreshCw } from "lucide-react";
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
import PremiumModal from "@/components/PremiumModal";
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
  const { user, profile, incrementViewCount, canViewBook } = useAuth();
  const { enrichBook } = useBookEnrichment();
  const [book, setBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [hasViewedContent, setHasViewedContent] = useState(false);
  
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
        
        // Track book view
        await supabase.from('book_views').insert({
          book_id: bookId,
          user_id: user?.id || null,
          view_type: 'detail_page'
        });

        // Check if user can view - if not, show paywall
        if (!canViewBook && user && !hasViewedContent) {
          setShowPremiumModal(true);
        } else if (user && !profile?.is_premium && !hasViewedContent) {
          // Track the view for non-premium users
          await incrementViewCount();
          setHasViewedContent(true);
        }

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
  }, [bookId, user, profile, canViewBook]);

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + (review.rating || 0), 0);
    return Math.round(sum / reviews.length);
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to submit a review",
        variant: "destructive",
      });
      return;
    }

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
          reviewText,
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
  const isPremium = profile?.is_premium;
  const showLimitedView = !user || (!isPremium && !canViewBook);

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
  const themeStyle = getThemeStyle(book?.genre || book?.mood);
  const heatConfig = getHeatLevelConfig(book?.heat_level);

  return (
    <>
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
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            {profile?.is_premium && (
              <Button
                variant="outline"
                onClick={handleEnrichBook}
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
                  {!showLimitedView && book.heat_level && (
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

              {showLimitedView ? (
                <Card className="p-8 mt-8 bg-gradient-to-br from-blush/20 to-dusty-rose/20 border-dusty-rose/30">
                  <div className="text-center space-y-4">
                    <Lock className="w-12 h-12 text-dusty-rose mx-auto" />
                    <h3 className="text-2xl font-serif font-semibold">💕 Premium Content</h3>
                    <p className="text-muted-foreground">
                      {user ? 
                        "Unlock unlimited access to view complete book details, summaries, and reviews." :
                        "Sign in to view more details about this book."
                      }
                    </p>
                    <div className="flex gap-3 justify-center pt-4">
                      {user ? (
                        <Button 
                          onClick={() => window.location.href = 'https://ummverse.lemonsqueezy.com/buy/ummverse-premium'}
                          className="bg-gradient-to-r from-primary to-dusty-rose"
                        >
                          Unlock Full Access
                        </Button>
                      ) : (
                        <>
                          <Button onClick={() => navigate('/auth')}>
                            Sign In
                          </Button>
                          <Button variant="outline" onClick={() => navigate('/auth')}>
                            Create Account
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ) : (
                <>
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
                </>
              )}
            </div>
          </motion.div>

          {/* Reviews Section - Only for premium users */}
          {!showLimitedView && (
            <>
              <Separator className="my-12" />

              {/* Submit Review */}
              {user && (
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
                                className={`w-8 h-8 ${
                                  star <= (hoverRating || formRating)
                                    ? "fill-dusty-rose text-dusty-rose"
                                    : "text-muted-foreground"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Review Text */}
                      <div>
                        <Label htmlFor="review" className="text-base mb-2 block">
                          Your Review
                        </Label>
                        <Textarea
                          id="review"
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          placeholder="Share your thoughts about this book..."
                          className="min-h-[120px] resize-none"
                        />
                      </div>

                      {/* Nickname */}
                      <div>
                        <Label htmlFor="nickname" className="text-base mb-2 block">
                          Nickname (Optional)
                        </Label>
                        <Input
                          id="nickname"
                          value={nickname}
                          onChange={(e) => setNickname(e.target.value)}
                          placeholder="Anonymous"
                        />
                      </div>

                      <Button
                        onClick={handleSubmitReview}
                        disabled={isSubmitting || !formRating || !reviewText}
                        className="w-full bg-gradient-to-r from-primary to-dusty-rose"
                      >
                        {isSubmitting ? "Submitting..." : "Submit Review"}
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Existing Reviews */}
              {reviews.length > 0 && (
                <div className="mb-12">
                  <h3 className="text-2xl font-serif font-semibold mb-6">
                    Reader Reviews ({reviews.length})
                  </h3>
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <motion.div
                        key={review.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <Card className="p-6 bg-card/60 backdrop-blur-sm">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="font-semibold">
                                {review.nickname || 'Anonymous'}
                              </p>
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
                          <p className="text-muted-foreground leading-relaxed">
                            {review.review_text}
                          </p>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              <Separator className="my-12" />

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
                limit={4}
              />
            </>
          )}
        </div>

        {/* Rose Petals Animation */}
        <AnimatePresence>
          {showPetals && (
            <div className="fixed inset-0 pointer-events-none z-50">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{
                    x: Math.random() * window.innerWidth,
                    y: -50,
                    rotate: 0,
                    opacity: 1,
                  }}
                  animate={{
                    y: window.innerHeight + 50,
                    rotate: 360,
                    opacity: 0,
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    delay: Math.random() * 0.5,
                    ease: "linear",
                  }}
                  className="absolute"
                >
                  <Heart className="w-6 h-6 text-dusty-rose fill-dusty-rose" />
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      <PremiumModal open={showPremiumModal} onOpenChange={setShowPremiumModal} />
    </>
  );
};

export default BookDetail;
