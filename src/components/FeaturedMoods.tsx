import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

interface Mood {
  id: string;
  name: string;
  tagline: string | null;
  color_theme: string | null;
  background_style: string | null;
  created_at: string;
  genre_list: string[] | null;
}

const moodFields: Record<string, string> = {
  hot: "editorial-field--hot",
  mystical: "editorial-field--mystical",
  warm: "editorial-field--warm",
  dark: "editorial-field--dark",
  soft: "editorial-field--soft",
  bright: "editorial-field--bright",
  regal: "editorial-field--regal",
  default: "editorial-field--default",
};

const featuredMoodNames = [
  "Spicy & Steamy",
  "Magical & Enchanting",
  "Cozy & Comforting",
  "Dark & Intense"
];

const FeaturedMoods = () => {
  const [moods, setMoods] = useState<Mood[]>([]);

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
    <section id="featured-moods" className="scroll-mt-8 px-6 py-14 sm:py-20">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 flex flex-col justify-between gap-3 sm:mb-10 sm:flex-row sm:items-end"
        >
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Find your feeling</p>
            <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl">Choose the mood.</h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">Some days call for a little danger. Others, a softer place to land.</p>
        </motion.div>
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {moods.map((mood) => {
            const fieldClass = moodFields[mood.color_theme || ""] || moodFields.default;

            return (
              <motion.div key={mood.id} variants={item}>
                <Link
                  to={`/mood/${mood.id}`}
                  className={`group relative flex min-h-52 flex-col justify-between overflow-hidden rounded-md p-5 text-primary-foreground shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:min-h-60 sm:p-6 ${fieldClass}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground/70">Read by feeling</span>
                    <ArrowUpRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                  <div>
                    <h3 className="max-w-[15ch] font-serif text-3xl font-semibold leading-tight sm:text-4xl">{mood.name}</h3>
                    {mood.tagline && <p className="mt-2 max-w-[30ch] text-sm leading-relaxed text-primary-foreground/80">{mood.tagline}</p>}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedMoods;
