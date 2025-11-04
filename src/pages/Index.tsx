import { useState } from "react";
import { Navigate } from "react-router-dom";
import Hero from "@/components/Hero";
import FeaturedMoods from "@/components/FeaturedMoods";
import FeaturedTropes from "@/components/FeaturedTropes";
import Footer from "@/components/Footer";
import PremiumBanner from "@/components/PremiumBanner";
import PremiumQuotes from "@/components/PremiumQuotes";
import OnboardingQuiz from "@/components/OnboardingQuiz";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { isAdmin, loading } = useAuth();
  const [showOnboardingQuiz, setShowOnboardingQuiz] = useState(false);

  // Redirect admin users to their dashboard
  if (!loading && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const handleDiscoverClick = () => {
    setShowOnboardingQuiz(true);
  };
  
  return <main className="min-h-screen">
      <PremiumBanner />
      <Hero onDiscoverClick={handleDiscoverClick} />
      <PremiumQuotes />
      <FeaturedMoods />
      <FeaturedTropes />
      <Footer />
      
      <OnboardingQuiz open={showOnboardingQuiz} onClose={() => setShowOnboardingQuiz(false)} />
    </main>;
};
export default Index;