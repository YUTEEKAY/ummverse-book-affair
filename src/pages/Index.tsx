import { useState } from "react";
import Hero from "@/components/Hero";
import FeaturedMoods from "@/components/FeaturedMoods";
import FeaturedTropes from "@/components/FeaturedTropes";
import MostSearchedBooksCarousel from "@/components/MostSearchedBooksCarousel";
import HowItWorks from "@/components/HowItWorks";
import TodaysQuote from "@/components/TodaysQuote";
import Footer from "@/components/Footer";
import OnboardingQuiz from "@/components/OnboardingQuiz";

const Index = () => {
  const [showOnboardingQuiz, setShowOnboardingQuiz] = useState(false);

  const handleDiscoverClick = () => {
    setShowOnboardingQuiz(true);
  };
  
  return (
    <main className="min-h-screen">
      <Hero onDiscoverClick={handleDiscoverClick} />
      <HowItWorks />
      <TodaysQuote />
      <FeaturedMoods />
      <MostSearchedBooksCarousel />
      <FeaturedTropes />
      <Footer />
      
      <OnboardingQuiz open={showOnboardingQuiz} onClose={() => setShowOnboardingQuiz(false)} />
    </main>
  );
};

export default Index;
