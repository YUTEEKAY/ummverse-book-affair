import { ArrowDown, ArrowRight, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import readingRoom from "@/assets/ummverse-editorial.jpg";

interface HeroProps {
  onDiscoverClick?: () => void;
}

const Hero = ({ onDiscoverClick }: HeroProps) => {
  return (
    <header className="relative isolate flex min-h-[min(660px,82svh)] items-center overflow-hidden bg-foreground text-primary-foreground">
      <img
        src={readingRoom}
        alt="A quiet reading room with an open book and a cup of tea"
        width={1920}
        height={1152}
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-foreground/70" />
      <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-foreground/80 via-foreground/55 to-transparent" />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col px-6 py-7 sm:px-10 lg:px-14">
        <div className="flex items-center justify-between border-b border-primary-foreground/25 pb-4 text-xs font-medium uppercase tracking-[0.14em] text-primary-foreground/85 sm:text-sm">
          <span className="flex items-center gap-2"><Heart className="h-4 w-4" /> The Book Affair</span>
          <a href="#featured-moods" className="inline-flex items-center gap-2 transition-colors hover:text-primary-foreground">
            Explore the shelves <ArrowDown className="h-4 w-4" />
          </a>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
          className="max-w-2xl py-9 sm:py-12"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/80 sm:text-sm">A love letter to your next read</p>
          <h1 className="mb-4 font-serif text-6xl font-semibold leading-[0.92] text-primary-foreground sm:text-7xl lg:text-8xl">
            Ummverse<span className="text-accent">.</span>
          </h1>
          <p className="max-w-xl font-serif text-2xl leading-snug text-primary-foreground sm:text-3xl lg:text-4xl">
            Find romance that feels right — not by genre, but by emotion.
          </p>
          <p className="mt-3 font-serif text-base italic text-primary-foreground/80 sm:text-lg">
            Fall for the words. Stay for the feels.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Button
              type="button"
              onClick={onDiscoverClick}
              size="lg"
              className="h-12 gap-2 rounded-md bg-primary-foreground px-5 font-semibold text-primary shadow-soft hover:bg-primary-foreground/90"
            >
              Discover by feeling <ArrowRight className="h-4 w-4" />
            </Button>
            <a href="#featured-moods" className="inline-flex items-center gap-2 text-sm font-medium text-primary-foreground transition-colors hover:text-accent">
              Browse moods <ArrowDown className="h-4 w-4" />
            </a>
          </div>
        </motion.div>
      </div>
    </header>
  );
};

export default Hero;
