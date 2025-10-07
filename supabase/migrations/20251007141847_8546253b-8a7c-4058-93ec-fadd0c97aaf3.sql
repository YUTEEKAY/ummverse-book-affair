-- Add publication year and affiliate link columns to books table
ALTER TABLE books
ADD COLUMN publication_year INTEGER,
ADD COLUMN affiliate_harlequin TEXT,
ADD COLUMN affiliate_amazon TEXT,
ADD COLUMN affiliate_barnesnoble TEXT;