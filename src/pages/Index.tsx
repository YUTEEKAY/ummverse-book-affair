import Hero from "@/components/Hero";
import FeaturedBooks from "@/components/FeaturedBooks";
import QuoteCarousel from "@/components/QuoteCarousel";

const Index = () => {
  return (
    <main className="min-h-screen">
      <Hero />
      <FeaturedBooks />
      <QuoteCarousel />
    </main>
  );
};

export default Index;
