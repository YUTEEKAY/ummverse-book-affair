-- Create books table
CREATE TABLE public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  summary TEXT,
  cover_url TEXT,
  genre TEXT,
  trope TEXT,
  mood TEXT,
  heat_level TEXT,
  api_source TEXT,
  purchase_link TEXT,
  rating NUMERIC(3,2) CHECK (rating >= 0 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create quotes table
CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  author TEXT NOT NULL,
  book_title TEXT,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
  pen_name TEXT,
  review_text TEXT NOT NULL,
  hearts INTEGER CHECK (hearts >= 1 AND hearts <= 5),
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- Create moods table
CREATE TABLE public.moods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  tagline TEXT,
  genre_list TEXT[],
  color_theme TEXT,
  background_style TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create genres table
CREATE TABLE public.genres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create tropes table
CREATE TABLE public.tropes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tropes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public access (no authentication required)
-- Books policies
CREATE POLICY "Anyone can view books" ON public.books FOR SELECT USING (true);
CREATE POLICY "Anyone can insert books" ON public.books FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update books" ON public.books FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete books" ON public.books FOR DELETE USING (true);

-- Quotes policies
CREATE POLICY "Anyone can view quotes" ON public.quotes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert quotes" ON public.quotes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update quotes" ON public.quotes FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete quotes" ON public.quotes FOR DELETE USING (true);

-- Reviews policies
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Anyone can insert reviews" ON public.reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update reviews" ON public.reviews FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete reviews" ON public.reviews FOR DELETE USING (true);

-- Moods policies
CREATE POLICY "Anyone can view moods" ON public.moods FOR SELECT USING (true);
CREATE POLICY "Anyone can insert moods" ON public.moods FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update moods" ON public.moods FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete moods" ON public.moods FOR DELETE USING (true);

-- Genres policies
CREATE POLICY "Anyone can view genres" ON public.genres FOR SELECT USING (true);
CREATE POLICY "Anyone can insert genres" ON public.genres FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update genres" ON public.genres FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete genres" ON public.genres FOR DELETE USING (true);

-- Tropes policies
CREATE POLICY "Anyone can view tropes" ON public.tropes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert tropes" ON public.tropes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update tropes" ON public.tropes FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete tropes" ON public.tropes FOR DELETE USING (true);

-- Create indexes for better performance
CREATE INDEX idx_books_genre ON public.books(genre);
CREATE INDEX idx_books_trope ON public.books(trope);
CREATE INDEX idx_books_mood ON public.books(mood);
CREATE INDEX idx_reviews_book_id ON public.reviews(book_id);
CREATE INDEX idx_books_rating ON public.books(rating DESC);