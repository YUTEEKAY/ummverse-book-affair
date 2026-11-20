import { useState } from "react";
import Hero from "@/components/Hero";
import FeaturedMoods from "@/components/FeaturedMoods";
import FeaturedTropes from "@/components/FeaturedTropes";
import HowItWorks from "@/components/HowItWorks";
import TodaysQuote from "@/components/TodaysQuote";
import OnboardingQuiz from "@/components/OnboardingQuiz";
import FeaturedBooks from "@/components/FeaturedBooks";

const Index = () => {
  const [showOnboardingQuiz, setShowOnboardingQuiz] = useState(false);

  const handleDiscoverClick = () => {
    setShowOnboardingQuiz(true);
  };
  
  return (
    <main className="min-h-screen">
      <Hero onDiscoverClick={handleDiscoverClick} />
      <TodaysQuote />
      <HowItWorks />
      <FeaturedBooks />
      <FeaturedMoods />
      <FeaturedTropes />
      
      
      <OnboardingQuiz open={showOnboardingQuiz} onClose={() => setShowOnboardingQuiz(false)} />
    </main>
  );
};

export default Index;
