import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const Hero = () => {
  return (
    <header className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blush via-cream to-dusty-rose animate-gradient" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-5xl mx-auto px-6 text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex justify-center mb-8"
        >
          <Heart className="w-20 h-20 text-primary fill-primary animate-float" />
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-6xl md:text-8xl font-bold mb-6 font-serif text-primary"
        >
          Ummverse
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="text-3xl md:text-5xl font-serif mb-4 text-foreground"
        >
          The Book Affair
        </motion.p>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="text-xl md:text-2xl text-muted-foreground mb-12 italic font-serif"
        >
          Fall for the words. Stay for the feels.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button 
            size="lg" 
            className="text-lg px-8 py-6 rounded-2xl shadow-soft hover:shadow-glow hover:scale-105 transition-all duration-300 bg-gradient-romance text-white border-none"
          >
            Find Me a Romance 💞
          </Button>
          <Button 
            size="lg" 
            variant="secondary"
            className="text-lg px-8 py-6 rounded-2xl shadow-soft hover:shadow-card hover:scale-105 transition-all duration-300 bg-white/80 backdrop-blur-sm"
          >
            Explore Moods 🌙
          </Button>
        </motion.div>
      </motion.div>
    </header>
  );
};

export default Hero;
