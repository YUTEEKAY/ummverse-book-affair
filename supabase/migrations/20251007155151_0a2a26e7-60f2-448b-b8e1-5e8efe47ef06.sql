-- Add new columns to books table for enhanced metadata
ALTER TABLE public.books 
ADD COLUMN IF NOT EXISTS publication_year integer,
ADD COLUMN IF NOT EXISTS publisher text,
ADD COLUMN IF NOT EXISTS language text,
ADD COLUMN IF NOT EXISTS rating numeric;

-- Create index for deduplication checks (title + author)
CREATE INDEX IF NOT EXISTS idx_books_title_author ON public.books(title, author);

-- Create index for publication year filtering
CREATE INDEX IF NOT EXISTS idx_books_publication_year ON public.books(publication_year);

-- Add a column to track import source
ALTER TABLE public.books 
ADD COLUMN IF NOT EXISTS import_source text DEFAULT 'manual';

COMMENT ON COLUMN public.books.publication_year IS 'Year the book was published';
COMMENT ON COLUMN public.books.publisher IS 'Publisher name';
COMMENT ON COLUMN public.books.language IS 'Book language (e.g., English, Spanish)';
COMMENT ON COLUMN public.books.rating IS 'Book rating (0-5 scale)';
COMMENT ON COLUMN public.books.import_source IS 'Source of book data (manual, csv_import, api, etc.)';