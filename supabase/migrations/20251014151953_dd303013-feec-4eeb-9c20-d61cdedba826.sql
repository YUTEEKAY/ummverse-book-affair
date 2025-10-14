-- Add missing moods that have books but no mood entries
INSERT INTO public.moods (name, tagline, color_theme, genre_list, background_style)
VALUES 
  ('Dark & Intense', 'Love in the shadows', 'dark', ARRAY['Dark Romance', 'Suspense'], 'dark-gradient'),
  ('Playful', 'Light-hearted romance with a smile', 'bright', ARRAY['Rom-Com', 'Contemporary'], 'bright-gradient'),
  ('Bittersweet', 'Beautiful heartache and tender moments', 'soft', ARRAY['Contemporary', 'Women''s Fiction'], 'soft-gradient')
ON CONFLICT (name) DO NOTHING;