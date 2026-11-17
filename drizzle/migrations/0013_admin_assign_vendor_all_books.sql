CREATE OR REPLACE FUNCTION public.admin_assign_vendor_to_all_books(_vendor_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  INSERT INTO public.book_vendors (book_id, vendor_id)
  SELECT b.id, _vendor_id FROM public.books b
  WHERE NOT EXISTS (SELECT 1 FROM public.book_vendors bv WHERE bv.book_id = b.id AND bv.vendor_id = _vendor_id);
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_assign_vendor_to_all_books(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_assign_vendor_to_all_books(uuid) TO authenticated;