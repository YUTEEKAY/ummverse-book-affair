CREATE TABLE public.vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'Nigerian Vendor' CHECK (type IN ('Nigerian Vendor','Online Store')),
  instagram_handle text,
  phone_number text,
  website_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.book_vendors (
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (book_id, vendor_id)
);
CREATE INDEX book_vendors_vendor_idx ON public.book_vendors(vendor_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendors TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.book_vendors TO authenticated;
GRANT ALL ON public.vendors TO service_role;
GRANT ALL ON public.book_vendors TO service_role;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Paid members and admins view vendors" ON public.vendors FOR SELECT TO authenticated
  USING (public.is_paid_member(auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage vendors" ON public.vendors FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Paid members and admins view book vendors" ON public.book_vendors FOR SELECT TO authenticated
  USING (public.is_paid_member(auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage book vendors" ON public.book_vendors FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Everyone learns how many vendors a book has; only paid members and admins get the contact details.
CREATE OR REPLACE FUNCTION public.get_book_vendors(_book_id uuid)
RETURNS TABLE(id uuid, name text, type text, instagram_handle text, phone_number text, website_url text, total_count bigint, full_access boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _full boolean := auth.uid() IS NOT NULL AND (public.is_paid_member(auth.uid()) OR public.has_role(auth.uid(),'admin'));
  _total bigint;
BEGIN
  SELECT count(*) INTO _total FROM public.book_vendors bv WHERE bv.book_id = _book_id;
  IF _full THEN
    RETURN QUERY SELECT v.id, v.name, v.type, v.instagram_handle, v.phone_number, v.website_url, _total, true
      FROM public.book_vendors bv JOIN public.vendors v ON v.id = bv.vendor_id
      WHERE bv.book_id = _book_id ORDER BY v.type, v.name;
  ELSE
    RETURN QUERY SELECT NULL::uuid, NULL::text, NULL::text, NULL::text, NULL::text, NULL::text, _total, false;
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.get_book_vendors(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_book_vendors(uuid) TO anon, authenticated;