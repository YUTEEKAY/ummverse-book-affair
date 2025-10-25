-- Phase 1 & 2: Secure Content Tables - Restrict INSERT/UPDATE/DELETE to admins only
-- Drop overly permissive policies for books table
DROP POLICY IF EXISTS "Anyone can insert books" ON public.books;
DROP POLICY IF EXISTS "Anyone can update books" ON public.books;
DROP POLICY IF EXISTS "Anyone can delete books" ON public.books;

-- Create secure admin-only policies for books
CREATE POLICY "Only admins can insert books" ON public.books 
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update books" ON public.books 
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete books" ON public.books 
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Drop overly permissive policies for genres table
DROP POLICY IF EXISTS "Anyone can insert genres" ON public.genres;
DROP POLICY IF EXISTS "Anyone can update genres" ON public.genres;
DROP POLICY IF EXISTS "Anyone can delete genres" ON public.genres;

-- Create secure admin-only policies for genres
CREATE POLICY "Only admins can insert genres" ON public.genres 
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update genres" ON public.genres 
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete genres" ON public.genres 
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Drop overly permissive policies for moods table
DROP POLICY IF EXISTS "Anyone can insert moods" ON public.moods;
DROP POLICY IF EXISTS "Anyone can update moods" ON public.moods;
DROP POLICY IF EXISTS "Anyone can delete moods" ON public.moods;

-- Create secure admin-only policies for moods
CREATE POLICY "Only admins can insert moods" ON public.moods 
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update moods" ON public.moods 
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete moods" ON public.moods 
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Drop overly permissive policies for tropes table
DROP POLICY IF EXISTS "Anyone can insert tropes" ON public.tropes;
DROP POLICY IF EXISTS "Anyone can update tropes" ON public.tropes;
DROP POLICY IF EXISTS "Anyone can delete tropes" ON public.tropes;

-- Create secure admin-only policies for tropes
CREATE POLICY "Only admins can insert tropes" ON public.tropes 
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update tropes" ON public.tropes 
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete tropes" ON public.tropes 
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Drop overly permissive policies for quotes table
DROP POLICY IF EXISTS "Anyone can insert quotes" ON public.quotes;
DROP POLICY IF EXISTS "Anyone can update quotes" ON public.quotes;
DROP POLICY IF EXISTS "Anyone can delete quotes" ON public.quotes;

-- Create secure admin-only policies for quotes
CREATE POLICY "Only admins can insert quotes" ON public.quotes 
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update quotes" ON public.quotes 
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete quotes" ON public.quotes 
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Phase 2: Secure Reviews System - Add user_id column and update policies
-- Add user_id column to reviews table (nullable for existing reviews)
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add rating column (replacing hearts)
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5);

-- Add nickname column (replacing pen_name)
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS nickname TEXT;

-- Add created_at column
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add user_ip column for rate limiting
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS user_ip TEXT;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_reviews_user_book ON public.reviews(user_id, book_id);
CREATE INDEX IF NOT EXISTS idx_reviews_ip_book_time ON public.reviews(user_ip, book_id, created_at);

-- Drop overly permissive policies for reviews
DROP POLICY IF EXISTS "Anyone can insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can update reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can delete reviews" ON public.reviews;

-- Create secure review policies
CREATE POLICY "Authenticated users can insert own reviews" ON public.reviews
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON public.reviews
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews" ON public.reviews
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Admins can manage all reviews
CREATE POLICY "Admins can delete any review" ON public.reviews
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));