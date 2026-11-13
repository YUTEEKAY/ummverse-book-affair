CREATE OR REPLACE FUNCTION public.trigger_enrich_new_book()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  -- Skip when the backend URL setting is missing, so adding a book never fails
  IF NEW.api_source IS NULL AND current_setting('app.supabase_url', true) IS NOT NULL THEN
    PERFORM net.http_post(
      url := current_setting('app.supabase_url', true) || '/functions/v1/enrich-single-book',
      headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || coalesce(current_setting('app.supabase_service_role_key', true), '')),
      body := jsonb_build_object('bookId', NEW.id, 'title', NEW.title, 'author', NEW.author)
    );
  END IF;
  RETURN NEW;
END;
$function$;