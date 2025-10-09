-- Create book_views table to track book visits
CREATE TABLE IF NOT EXISTS public.book_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  view_type text DEFAULT 'detail_page',
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_book_views_book_id ON public.book_views(book_id);
CREATE INDEX IF NOT EXISTS idx_book_views_created_at ON public.book_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_book_views_book_created ON public.book_views(book_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.book_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can insert book views"
  ON public.book_views 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can view book analytics"
  ON public.book_views 
  FOR SELECT 
  USING (true);