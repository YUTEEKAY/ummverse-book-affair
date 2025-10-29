-- Add new columns to profiles table for enhanced user profile
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS favorite_genres TEXT[],
ADD COLUMN IF NOT EXISTS preferred_heat_levels TEXT[],
ADD COLUMN IF NOT EXISTS profile_visibility TEXT DEFAULT 'public',
ADD COLUMN IF NOT EXISTS reading_goal_monthly INTEGER,
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email_recommendations": true, "email_new_books": false}'::jsonb;

-- Create user_reading_lists table
CREATE TABLE IF NOT EXISTS public.user_reading_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  list_type TEXT NOT NULL CHECK (list_type IN ('want_to_read', 'currently_reading', 'completed')),
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, book_id, list_type)
);

-- Enable RLS on user_reading_lists
ALTER TABLE public.user_reading_lists ENABLE ROW LEVEL SECURITY;

-- Users can view their own reading lists
CREATE POLICY "Users can view own reading lists"
ON public.user_reading_lists
FOR SELECT
USING (auth.uid() = user_id);

-- Users can add to their own reading lists
CREATE POLICY "Users can insert own reading lists"
ON public.user_reading_lists
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own reading lists
CREATE POLICY "Users can update own reading lists"
ON public.user_reading_lists
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete from their own reading lists
CREATE POLICY "Users can delete own reading lists"
ON public.user_reading_lists
FOR DELETE
USING (auth.uid() = user_id);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_type)
);

-- Enable RLS on user_achievements
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Users can view their own achievements
CREATE POLICY "Users can view own achievements"
ON public.user_achievements
FOR SELECT
USING (auth.uid() = user_id);

-- System can insert achievements
CREATE POLICY "Service role can insert achievements"
ON public.user_achievements
FOR INSERT
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_reading_lists_user_id ON public.user_reading_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reading_lists_book_id ON public.user_reading_lists(book_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);