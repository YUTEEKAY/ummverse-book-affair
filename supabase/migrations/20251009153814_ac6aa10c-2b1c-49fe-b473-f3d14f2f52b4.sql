-- Fix security warning: Set search_path for trigger function
CREATE OR REPLACE FUNCTION trigger_enrich_new_book()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only enrich if book doesn't already have api_source
  IF NEW.api_source IS NULL THEN
    PERFORM net.http_post(
      url := current_setting('app.supabase_url', true) || '/functions/v1/enrich-single-book',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
      ),
      body := jsonb_build_object(
        'bookId', NEW.id,
        'title', NEW.title,
        'author', NEW.author
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Move pg_net extension to extensions schema (fix security warning)
DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;