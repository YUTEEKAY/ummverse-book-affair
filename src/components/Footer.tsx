import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const Footer = () => {
  return (
    <footer className="relative py-12 px-6 bg-gradient-to-t from-blush/30 to-background border-t border-dusty-rose/20">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-center gap-2"
        >
          <p className="text-lg text-muted-foreground font-serif">
            Made with love by{" "}
            <span className="text-primary font-semibold">Ummu Salama</span>
          </p>
          <Sparkles className="w-5 h-5 text-primary animate-sparkle" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-4 text-sm text-muted-foreground italic"
        >
          Where every page turns into a love story
        </motion.p>
      </div>
    </footer>
  );
};

export default Footer;
