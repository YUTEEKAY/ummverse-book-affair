
interface BookCoverPlaceholderProps {
  title: string;
  author?: string | null;
  genre?: string | null;
  mood?: string | null;
  className?: string;
}

const BookCoverPlaceholder = ({ title, author, genre, mood, className = "" }: BookCoverPlaceholderProps) => {
  // Determine theme based on genre or mood
  const colorTheme = `${genre ?? ""} ${mood ?? ""}`;
  const theme = /dark|intense/i.test(colorTheme) ? "dark" : /fantasy|magical/i.test(colorTheme) ? "mystical" : /cozy|sweet/i.test(colorTheme) ? "bright" : "hot";
  
  return (
    <div
      className={`book-hardcover editorial-cover editorial-field--${theme} w-full h-full flex flex-col items-center justify-between p-5 ${className}`}
    >
      <span className="text-center text-[10px] uppercase tracking-widest">{genre || "The reading collection"}</span>
      <p className="text-center font-serif text-xl font-semibold leading-snug line-clamp-6 break-words">
        {title}
      </p>
      <p className="text-center text-xs font-medium line-clamp-2">{author}</p>
    </div>
  );
};

export default BookCoverPlaceholder;
