CREATE OR REPLACE FUNCTION public.is_paid_member(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _uid IS NOT NULL AND (public.has_active_subscription(_uid, 'live') OR public.has_active_subscription(_uid, 'sandbox'))
$$;
REVOKE ALL ON FUNCTION public.is_paid_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_paid_member(uuid) TO authenticated;

DROP POLICY IF EXISTS "Anyone can insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON public.reviews;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
REVOKE INSERT, UPDATE, DELETE ON public.reviews FROM anon;

CREATE POLICY "Paid members and admins can view all reviews" ON public.reviews FOR SELECT TO authenticated
  USING (public.is_paid_member(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Paid members can insert reviews" ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (public.is_paid_member(auth.uid()) AND user_id = auth.uid());
CREATE POLICY "Paid members can update own reviews" ON public.reviews FOR UPDATE TO authenticated
  USING (public.is_paid_member(auth.uid()) AND auth.uid() = user_id)
  WITH CHECK (public.is_paid_member(auth.uid()) AND auth.uid() = user_id);
CREATE POLICY "Paid members can delete own reviews" ON public.reviews FOR DELETE TO authenticated
  USING (public.is_paid_member(auth.uid()) AND auth.uid() = user_id);

-- Public preview: everyone sees the top 3; paid members get all.
CREATE OR REPLACE FUNCTION public.get_book_reviews(_book_id uuid)
RETURNS TABLE (id uuid, review_text text, pen_name text, hearts integer, created_at timestamptz, total_count bigint, full_access boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  full_ boolean := public.is_paid_member(auth.uid()) OR public.has_role(auth.uid(), 'admin');
  total bigint;
BEGIN
  SELECT count(*) INTO total FROM public.reviews r WHERE r.book_id = _book_id;
  RETURN QUERY
  SELECT r.id, r.review_text, r.pen_name, r.hearts, COALESCE(r.timestamp, r.created_at), total, full_
  FROM public.reviews r
  WHERE r.book_id = _book_id
  ORDER BY CASE WHEN full_ THEN NULL ELSE COALESCE(r.hearts, r.rating, 0) END DESC NULLS LAST,
           COALESCE(r.timestamp, r.created_at) DESC
  LIMIT CASE WHEN full_ THEN NULL ELSE 3 END;
END $$;
GRANT EXECUTE ON FUNCTION public.get_book_reviews(uuid) TO anon, authenticated;