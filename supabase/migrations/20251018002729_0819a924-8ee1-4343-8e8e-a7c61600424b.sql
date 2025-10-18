-- Add ISBN fields to books table for enhanced cover fetching
ALTER TABLE books ADD COLUMN IF NOT EXISTS isbn TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS isbn13 TEXT;

-- Add indexes for faster ISBN lookups
CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);
CREATE INDEX IF NOT EXISTS idx_books_isbn13 ON books(isbn13);