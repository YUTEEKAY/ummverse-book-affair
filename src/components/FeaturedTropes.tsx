import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

interface Trope {
  id: string;
  name: string;
  description: string | null;
  color_theme: string | null;
  created_at: string;
}

const tropeFields: Record<string, string> = {
  hot: "editorial-field--hot",
  warm: "editorial-field--warm",
  mystical: "editorial-field--mystical",
  soft: "editorial-field--soft",
  bright: "editorial-field--bright",
  dark: "editorial-field--dark",
  contemporary: "editorial-field--contemporary",
  regal: "editorial-field--regal",
  default: "editorial-field--default",
};

const FeaturedTropes = () => {
  const [tropes, setTropes] = useState<Trope[]>([]);

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
    <section id="featured-tropes" className="scroll-mt-8 px-6 py-14 sm:py-20">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 flex flex-col justify-between gap-3 sm:mb-10 sm:flex-row sm:items-end"
        >
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Every good story has one</p>
            <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl">The plot thickens.</h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">The deliciously familiar twists that keep you turning pages.</p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {tropes.map((trope) => {
            const fieldClass = tropeFields[trope.color_theme || ""] || tropeFields.default;

            return (
              <motion.div key={trope.id} variants={item}>
                <Link
                  to={`/trope/${trope.id}`}
                  className={`group flex min-h-44 flex-col justify-between rounded-md p-5 text-primary-foreground shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:min-h-48 sm:p-6 ${fieldClass}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground/70">A favorite trope</span>
                    <ArrowUpRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl font-semibold leading-tight sm:text-3xl">{trope.name}</h3>
                    {trope.description && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-primary-foreground/80">{trope.description}</p>}
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

export default FeaturedTropes;
