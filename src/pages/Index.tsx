import { useEffect, useState } from "react";
import Hero from "@/components/Hero";
import FeaturedMoods from "@/components/FeaturedMoods";
import Footer from "@/components/Footer";
import PremiumBanner from "@/components/PremiumBanner";
import OnboardingQuiz from "@/components/OnboardingQuiz";
import { hasCompletedOnboarding } from "@/lib/quizStorage";

const Index = () => {
  const [showOnboardingQuiz, setShowOnboardingQuiz] = useState(false);

  useEffect(() => {
    const hasCompleted = hasCompletedOnboarding();
    
    if (!hasCompleted) {
      // Show quiz after 1 second delay for better UX
      const timer = setTimeout(() => {
        setShowOnboardingQuiz(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <main className="min-h-screen">
      <PremiumBanner />
      <Hero />
      <FeaturedMoods />
      <Footer />
      
      <OnboardingQuiz
        open={showOnboardingQuiz}
        onClose={() => setShowOnboardingQuiz(false)}
      />
    </main>
  );
};

export default Index;
