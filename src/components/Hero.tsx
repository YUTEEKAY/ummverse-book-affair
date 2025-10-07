import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-books.jpg";

const Hero = () => {
  return (
    <header className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 gradient-hero" />
      
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <div className="flex justify-center mb-6 animate-pulse">
          <Heart className="w-16 h-16 text-primary fill-primary" />
        </div>
        
        <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Ummverse
        </h1>
        
        <p className="text-3xl md:text-5xl font-serif mb-4 text-foreground">
          The Book Affair
        </p>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-12 italic">
          Fall for the words. Stay for the feels.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            className="gradient-romance text-lg px-8 py-6 shadow-soft hover:shadow-lg transition-all"
          >
            Explore by Mood
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="text-lg px-8 py-6 border-2 border-primary hover:bg-primary/10"
          >
            Browse All Books
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Hero;
