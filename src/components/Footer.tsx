import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";

const Footer = () => {
  return (
    <footer className="relative py-12 px-6 bg-gradient-to-t from-blush/30 to-background border-t border-dusty-rose/20">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-center gap-2"
        >
          <p className="text-lg text-muted-foreground font-serif">
            Made with love and reverence for every romantic soul — where passion meets pages and stories breathe tenderness.
          </p>
          <Sparkles className="w-5 h-5 text-primary animate-sparkle" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-sm text-muted-foreground italic"
        >
          Where every page turns into a love story
        </motion.p>

        <Separator className="max-w-xs mx-auto" />

        {/* Legal Links */}
        <motion.nav
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-2 text-sm"
          aria-label="Legal"
        >
          <Link
            to="/terms"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            Terms & Conditions
          </Link>
          <span className="text-muted-foreground/50">•</span>
          <Link
            to="/privacy"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            Privacy Policy
          </Link>
          <span className="text-muted-foreground/50">•</span>
          <Link
            to="/disclaimer"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            Disclaimer
          </Link>
        </motion.nav>

        {/* Contact & Copyright */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-xs text-muted-foreground/80 space-y-2"
        >
          <p>
            © 2025 Ummverse: The Book Affair • All Rights Reserved
          </p>
          <p>
            <a
              href="mailto:support@ummverse.com.ng"
              className="hover:text-primary transition-colors"
            >
              support@ummverse.com.ng
            </a>
            {" • "}
            Abuja, Nigeria
          </p>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
