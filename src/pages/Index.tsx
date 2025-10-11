import Hero from "@/components/Hero";
import FeaturedMoods from "@/components/FeaturedMoods";
import Footer from "@/components/Footer";
import PremiumBanner from "@/components/PremiumBanner";

const Index = () => {
  return (
    <main className="min-h-screen">
      <PremiumBanner />
      <Hero />
      <FeaturedMoods />
      <Footer />
    </main>
  );
};

export default Index;
