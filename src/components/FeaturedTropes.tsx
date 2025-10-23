import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface Trope {
  id: string;
  name: string;
  description: string | null;
  color_theme: string | null;
  created_at: string;
}

const tropeGradients: Record<string, string> = {
  hot: "bg-gradient-to-br from-orange-500 via-red-600 to-rose-700",
  warm: "bg-gradient-to-br from-orange-300 via-amber-300 to-yellow-300",
  mystical: "bg-gradient-to-br from-indigo-600 via-violet-500 to-fuchsia-500",
  soft: "bg-gradient-to-br from-sky-300 via-blue-300 to-indigo-300",
  bright: "bg-gradient-to-br from-cyan-400 via-teal-400 to-emerald-400",
  dark: "bg-gradient-to-br from-gray-800 via-slate-900 to-zinc-900",
  contemporary: "bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500",
  regal: "bg-gradient-to-br from-violet-600 via-purple-500 to-indigo-600",
  default: "bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500",
};

const FeaturedTropes = () => {
  const [tropes, setTropes] = useState<Trope[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTropes = async () => {
      const { data } = await supabase
        .from("tropes")
        .select("*")
        .limit(6)
        .order("name");

      if (data) {
        setTropes(data);
      }
    };

    fetchTropes();
  }, []);

  if (tropes.length === 0) return null;

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
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1 },
  };

  return (
    <section id="featured-tropes" className="py-20 px-6 bg-gradient-to-b from-blush/10 to-background">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4 text-foreground">
            Popular Romance Tropes
          </h2>
          <p className="text-lg text-muted-foreground">
            Discover your favorite romance storylines
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {tropes.map((trope) => {
            const gradientClass = tropeGradients[trope.color_theme || ""] || tropeGradients.default;

            return (
              <motion.div key={trope.id} variants={item}>
                <Card
                  onClick={() => navigate(`/trope/${trope.id}`)}
                  className={`group relative overflow-hidden rounded-2xl shadow-soft hover:shadow-glow-strong transition-all duration-500 cursor-pointer h-56 border-none ${gradientClass}`}
                >
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-500" />
                  <div className="relative h-full flex flex-col items-center justify-center p-6 text-center text-white">
                    <h3 className="text-2xl md:text-3xl font-serif font-bold mb-2 group-hover:scale-110 transition-transform duration-500 drop-shadow-lg">
                      {trope.name}
                    </h3>
                    {trope.description && (
                      <p className="text-sm md:text-base opacity-90 drop-shadow-md line-clamp-3">
                        {trope.description}
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

export default FeaturedTropes;
