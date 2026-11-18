ALTER TABLE public.books ADD COLUMN featured_slot integer;
ALTER TABLE public.books ADD CONSTRAINT books_featured_slot_range CHECK (featured_slot BETWEEN 1 AND 3);
CREATE UNIQUE INDEX books_featured_slot_unique ON public.books(featured_slot) WHERE featured_slot IS NOT NULL;