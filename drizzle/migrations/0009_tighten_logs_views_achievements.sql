DROP POLICY IF EXISTS "Anyone can view enrichment logs" ON public.enrichment_logs;
DROP POLICY IF EXISTS "Service role can insert enrichment logs" ON public.enrichment_logs;
CREATE POLICY "Admins can view enrichment logs" ON public.enrichment_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert enrichment logs" ON public.enrichment_logs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
GRANT ALL ON public.enrichment_logs TO service_role;

DROP POLICY IF EXISTS "Service role can insert achievements" ON public.user_achievements;
GRANT ALL ON public.user_achievements TO service_role;

DROP POLICY IF EXISTS "Anyone can insert book views" ON public.book_views;
DROP POLICY IF EXISTS "Anyone can view book analytics" ON public.book_views;
CREATE POLICY "Visitors can record own book views" ON public.book_views FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "Admins can view book analytics" ON public.book_views FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
GRANT ALL ON public.book_views TO service_role;

CREATE OR REPLACE FUNCTION public.get_most_viewed_books(_days integer DEFAULT 30, _limit integer DEFAULT 6)
RETURNS TABLE(book_id uuid, views bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT bv.book_id, count(*)::bigint AS views
  FROM public.book_views bv
  WHERE bv.created_at >= now() - make_interval(days => LEAST(GREATEST(_days, 1), 365))
  GROUP BY bv.book_id
  ORDER BY views DESC
  LIMIT LEAST(GREATEST(_limit, 1), 50);
$$;
REVOKE ALL ON FUNCTION public.get_most_viewed_books(integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_most_viewed_books(integer, integer) TO anon, authenticated, service_role;