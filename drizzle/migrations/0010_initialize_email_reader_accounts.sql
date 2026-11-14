ALTER TABLE public.profiles ALTER COLUMN subscription_status SET DEFAULT 'free';
CREATE OR REPLACE FUNCTION public.initialize_reader_usage() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN INSERT INTO public.feature_usage(user_id, uses) VALUES (NEW.id, 0) ON CONFLICT (user_id) DO NOTHING; RETURN NEW; END; $$;
REVOKE ALL ON FUNCTION public.initialize_reader_usage() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER initialize_reader_usage_after_profile AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.initialize_reader_usage();