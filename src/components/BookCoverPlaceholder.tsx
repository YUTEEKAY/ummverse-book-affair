import { motion } from "framer-motion";
import { Book } from "lucide-react";
import { getThemeStyle } from "@/lib/themeGradients";

interface BookCoverPlaceholderProps {
  title: string;
  genre?: string | null;
  mood?: string | null;
  className?: string;
}

const BookCoverPlaceholder = ({ title, genre, mood, className = "" }: BookCoverPlaceholderProps) => {
  // Determine theme based on genre or mood
  const colorTheme = genre || mood || "default";
  const theme = getThemeStyle(colorTheme.toLowerCase());
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br ${theme.gradient} ${className}`}
    >
      <Book className={`w-16 h-16 mb-4 ${theme.textColor}`} />
      <p className={`text-center font-serif text-sm ${theme.textColor} line-clamp-3`}>
        {title}
      </p>
    </motion.div>
  );
};

export default BookCoverPlaceholder;
