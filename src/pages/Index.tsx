import Hero from "@/components/Hero";
import TodaysQuote from "@/components/TodaysQuote";
import PopularMoods from "@/components/PopularMoods";
import MostSearchedBooksCarousel from "@/components/MostSearchedBooksCarousel";
import Footer from "@/components/Footer";
import PremiumBanner from "@/components/PremiumBanner";

const Index = () => {
  return (
    <main className="min-h-screen">
      <PremiumBanner />
      <Hero />
      <TodaysQuote />
      <PopularMoods />
      <MostSearchedBooksCarousel />
      <Footer />
    </main>
  );
};

export default Index;
