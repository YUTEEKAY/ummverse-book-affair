import Hero from "@/components/Hero";
import TodaysQuote from "@/components/TodaysQuote";
import PopularMoods from "@/components/PopularMoods";
import TrendingBooksCarousel from "@/components/TrendingBooksCarousel";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen">
      <Hero />
      <TodaysQuote />
      <PopularMoods />
      <TrendingBooksCarousel />
      <Footer />
    </main>
  );
};

export default Index;
