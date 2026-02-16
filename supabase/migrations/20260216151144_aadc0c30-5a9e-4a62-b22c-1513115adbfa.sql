
-- Allow anyone to insert reviews (anonymous)
DROP POLICY IF EXISTS "Authenticated users can insert own reviews" ON public.reviews;
CREATE POLICY "Anyone can insert reviews"
ON public.reviews
FOR INSERT
WITH CHECK (true);
