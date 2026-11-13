CREATE TABLE public.saved_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, book_id)
);
GRANT SELECT, INSERT, DELETE ON public.saved_books TO authenticated;
GRANT ALL ON public.saved_books TO service_role;
ALTER TABLE public.saved_books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own saved books" ON public.saved_books FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users save books for themselves" ON public.saved_books FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users remove own saved books" ON public.saved_books FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.quiz_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  book_ids uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX quiz_history_user_idx ON public.quiz_history (user_id, created_at DESC);
GRANT SELECT, INSERT, DELETE ON public.quiz_history TO authenticated;
GRANT ALL ON public.quiz_history TO service_role;
ALTER TABLE public.quiz_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own quiz history" ON public.quiz_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users add own quiz history" ON public.quiz_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own quiz history" ON public.quiz_history FOR DELETE TO authenticated USING (auth.uid() = user_id);