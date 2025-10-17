import { useState } from "react";
import Hero from "@/components/Hero";
import FeaturedMoods from "@/components/FeaturedMoods";
import FeaturedTropes from "@/components/FeaturedTropes";
import Footer from "@/components/Footer";
import PremiumBanner from "@/components/PremiumBanner";
import OnboardingQuiz from "@/components/OnboardingQuiz";
const Index = () => {
  const [showOnboardingQuiz, setShowOnboardingQuiz] = useState(false);
  const handleDiscoverClick = () => {
    setShowOnboardingQuiz(true);
  };
  return <main className="min-h-screen">
      <PremiumBanner />
      <Hero onDiscoverClick={handleDiscoverClick} />
      <FeaturedMoods />
      <FeaturedTropes />
      <Footer className="mx-px my-px px-px py-px" />
      
      <OnboardingQuiz open={showOnboardingQuiz} onClose={() => setShowOnboardingQuiz(false)} />
    </main>;
};
export default Index;