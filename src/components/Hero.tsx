import { useState } from "react";
import { Heart, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import RecommendationModal from "@/components/RecommendationModal";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const [showRecommendations, setShowRecommendations] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <header className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blush via-cream to-dusty-rose animate-gradient" />
      
      {/* Auth Button */}
      <div className="absolute top-6 right-6 z-20">
        {user ? (
          <Button
            type="button"
            variant="ghost"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Sign out clicked');
              signOut();
            }}
            className="bg-white/80 backdrop-blur-sm hover:bg-white"
          >
            <User className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        ) : (
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Sign in clicked');
              navigate('/auth');
            }}
            className="bg-white/80 backdrop-blur-sm hover:bg-white text-foreground"
            variant="ghost"
          >
            <User className="w-4 h-4 mr-2" />
            Sign In
          </Button>
        )}
      </div>
      
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
          style={{ textShadow: "0 2px 4px rgba(0, 0, 0, 0.15)" }}
        >
          Ummverse
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="text-2xl md:text-4xl font-serif mb-3 text-foreground leading-relaxed"
          style={{ textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)" }}
        >
          Find romance that feels right — not by genre, but by emotion.
        </motion.p>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="text-lg md:text-xl text-muted-foreground mb-12 italic font-serif"
          style={{ textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)" }}
        >
          Fall for the words. Stay for the feels.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="flex justify-center"
        >
          <Button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              document.getElementById('featured-moods')?.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
              });
            }}
            size="lg" 
            className="text-xl px-12 py-7 rounded-2xl shadow-soft hover:shadow-glow hover:scale-105 transition-all duration-300 bg-gradient-romance text-white border-none"
          >
            Discover by Feeling
          </Button>
        </motion.div>
      </motion.div>
      </header>

      <RecommendationModal 
        open={showRecommendations}
        onOpenChange={setShowRecommendations}
      />
    </>
  );
};

export default Hero;
