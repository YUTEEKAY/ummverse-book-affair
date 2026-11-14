import { useEffect, useMemo, useState } from "react";
import BookCoverPlaceholder from "./BookCoverPlaceholder";
import { coverCandidates, findCoverByTitle, findGoogleCover, usableCover } from "@/lib/coverUrls";

interface BookCoverProps {
  book: {
    title: string;
    author?: string | null;
    cover_url?: string | null;
    isbn?: string | null;
    isbn13?: string | null;
    genre?: string | null;
    mood?: string | null;
  };
  className?: string;
  eager?: boolean;
}

/** Cover image that tries the stored URL, then ISBN, then a title lookup, then a styled placeholder. */
const BookCover = ({ book, className = "", eager = false }: BookCoverProps) => {
  const initial = useMemo(() => coverCandidates(book), [book.cover_url, book.isbn, book.isbn13, book.title, book.author]);
  const [sources, setSources] = useState(initial);
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [lookedUp, setLookedUp] = useState(false);

  useEffect(() => {
    setSources(initial);
    setIndex(0);
    setLoaded(false);
    setLookedUp(false);
  }, [initial]);

  const exhausted = index >= sources.length;

  useEffect(() => {
    if (!exhausted || lookedUp) return;
    let active = true;
    Promise.all([findCoverByTitle(book.title, book.author), findGoogleCover(book.title, book.author)]).then((urls) => {
      if (!active) return;
      setLookedUp(true);
      setSources(s => [...s, ...urls.filter((url): url is string => !!url && !s.includes(url))]);
    });
    return () => { active = false; };
  }, [exhausted, lookedUp, book.title, book.author, sources]);

  if (exhausted) {
    return <BookCoverPlaceholder title={book.title} author={book.author} genre={book.genre} mood={book.mood} />;
  }

  return (
    <>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-muted" aria-hidden="true" />}
      <img
        key={sources[index]}
        src={sources[index]}
        alt={`Cover of ${book.title}`}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        referrerPolicy="no-referrer"
        className={`book-hardcover h-full w-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"} ${className}`}
        onLoad={(e) => {
          // Open Library returns a 1x1 image for unknown covers
          if (!usableCover(e.currentTarget.naturalWidth, e.currentTarget.naturalHeight)) { setLoaded(false); setIndex((i) => i + 1); return; }
          setLoaded(true);
        }}
        onError={() => { setLoaded(false); setIndex((i) => i + 1); }}
      />
    </>
  );
};

export default BookCover;
