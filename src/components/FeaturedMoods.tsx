import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface Mood {
  id: string;
  name: string;
  tagline: string | null;
  color_theme: string | null;
  background_style: string | null;
  created_at: string;
  genre_list: string[] | null;
}

const moodGradients: Record<string, string> = {
  warm: "bg-gradient-to-br from-warm-peach via-blush to-dusty-rose",
  hot: "bg-gradient-to-br from-red-400 via-orange-400 to-yellow-400",
  mystical: "bg-gradient-to-br from-purple-400 via-blue-400 to-indigo-400",
  default: "bg-gradient-romance",
};

const featuredMoodNames = [
  "Spicy & Steamy",
  "Magical & Enchanting",
  "Cozy & Comforting"
];

const FeaturedMoods = () => {
  const [moods, setMoods] = useState<Mood[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMoods = async () => {
      const { data } = await supabase
        .from("moods")
        .select("*")
        .in("name", featuredMoodNames);

      if (data) {
        // Sort to match the desired order
        const sortedMoods = featuredMoodNames
          .map(name => data.find(mood => mood.name === name))
          .filter((mood): mood is Mood => mood !== undefined);
        setMoods(sortedMoods);
      }
    };

    fetchMoods();
  }, []);

  if (moods.length === 0) return null;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1 },
  };

  return (
    <section id="featured-moods" className="py-20 px-6 bg-gradient-to-b from-background to-blush/10">
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {moods.map((mood) => {
            const gradientClass = moodGradients[mood.color_theme || ""] || moodGradients.default;

            return (
              <motion.div key={mood.id} variants={item}>
                <Card
                  onClick={() => navigate(`/mood/${mood.id}`)}
                  className={`group relative overflow-hidden rounded-3xl shadow-soft hover:shadow-glow-strong transition-all duration-500 cursor-pointer h-72 border-none ${gradientClass}`}
                >
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-500" />
                  <div className="relative h-full flex flex-col items-center justify-center p-8 text-center text-white">
                    <h3 className="text-3xl md:text-4xl font-serif font-bold mb-3 group-hover:scale-110 transition-transform duration-500 drop-shadow-lg">
                      {mood.name}
                    </h3>
                    {mood.tagline && (
                      <p className="text-base md:text-lg italic opacity-90 drop-shadow-md">
                        {mood.tagline}
                      </p>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedMoods;
