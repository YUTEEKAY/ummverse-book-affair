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
}

const moodGradients: Record<string, string> = {
  warm: "bg-gradient-to-br from-warm-peach via-blush to-dusty-rose",
  hot: "bg-gradient-to-br from-red-400 via-orange-400 to-yellow-400",
  mystical: "bg-gradient-to-br from-purple-400 via-blue-400 to-indigo-400",
  regal: "bg-gradient-to-br from-purple-900 via-red-900 to-amber-700",
  default: "bg-gradient-romance",
};

const PopularMoods = () => {
  const [moods, setMoods] = useState<Mood[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMoods = async () => {
      const { data } = await supabase
        .from("moods")
        .select("*")
        .order("name", { ascending: true })
        .limit(4);

      if (data) {
        setMoods(data);
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
        staggerChildren: 0.15,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1 },
  };

  return (
    <section id="moods" className="py-16 px-6 bg-gradient-to-b from-blush/20 to-background">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-serif text-primary mb-4">
            Explore by Mood
          </h2>
          <p className="text-lg text-muted-foreground italic">
            Find your perfect read based on how you're feeling
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {moods.map((mood) => {
            const gradientClass = moodGradients[mood.color_theme || ""] || moodGradients.default;

            return (
              <motion.div key={mood.id} variants={item}>
                <Card
                  onClick={() => navigate(`/mood/${mood.id}`)}
                  className={`group relative overflow-hidden rounded-2xl shadow-soft hover:shadow-glow-strong transition-all duration-300 cursor-pointer h-48 border-none ${gradientClass}`}
                >
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                  <div className="relative h-full flex flex-col items-center justify-center p-6 text-center text-white">
              <h3 className="text-2xl md:text-3xl font-serif font-bold mb-2 group-hover:scale-110 transition-transform drop-shadow-md">
                {mood.name}
              </h3>
              {mood.tagline && (
                <p className="text-sm md:text-base italic opacity-90 drop-shadow-sm">
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

export default PopularMoods;
