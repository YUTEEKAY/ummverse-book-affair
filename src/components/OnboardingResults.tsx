import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import BookCard from "@/components/BookCard";
import { getRecommendationsFromQuiz } from "@/lib/quizLogic";
import type { QuizAnswers } from "@/lib/quizStorage";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ShareBookVibe from "./ShareBookVibe";
interface OnboardingResultsProps {
  answers: QuizAnswers;
  onRetake: () => void;
  onClose: () => void;
}
const OnboardingResults = ({
  answers,
  onRetake,
  onClose: _onClose
}: OnboardingResultsProps) => {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      const recommendations = await getRecommendationsFromQuiz(answers);
      setBooks(recommendations);
      setLoading(false);
      if (user) {
        const { error } = await supabase.from("quiz_history").insert({
          user_id: user.id,
          answers: answers as any,
          book_ids: recommendations.map((b: any) => b.id),
        });
        if (error) console.error("Couldn't save quiz history:", error);
      }
    };
    fetchRecommendations();
  }, [answers]);
  return <motion.div initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: 1,
    y: 0
  }} className="space-y-6 bg-background">
      <div className="text-center space-y-2">
        <motion.div initial={{
        scale: 0
      }} animate={{
        scale: 1
      }} transition={{
        delay: 0.2,
        type: "spring"
      }}>
          <Zap className="w-12 h-12 mx-auto text-primary" />
        </motion.div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Your Perfect Matches
        </h2>
        <p className="text-muted-foreground">
          Based on your preferences, we've curated these romance reads just for you
        </p>
      </div>

      {loading ? <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-64 bg-muted/50 rounded-lg animate-pulse" />)}
        </div> : books.length > 0 ? <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto">
          {books.map(book => <BookCard key={book.id} book={book} />)}
        </div> : <div className="text-center py-12 space-y-4">
          <p className="text-muted-foreground">
            No perfect matches found yet, but we're always adding new books!
          </p>
          <Button onClick={onRetake} variant="outline">
            Try Different Preferences
          </Button>
        </div>}

      {!loading && books[0] && <ShareBookVibe book={books[0]} />}
      <div className="flex justify-center pt-4 border-t">
        <Button onClick={onRetake} variant="ghost">
          Retake Quiz
        </Button>
      </div>
    </motion.div>;
};
export default OnboardingResults;