-- Add page_count field to books table
ALTER TABLE books ADD COLUMN IF NOT EXISTS page_count integer;

-- Create enrichment_logs table for tracking
CREATE TABLE IF NOT EXISTS enrichment_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid REFERENCES books(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('success', 'partial', 'failed', 'skipped')),
  fields_updated text[],
  data_source text,
  error_message text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on enrichment_logs
ALTER TABLE enrichment_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for enrichment_logs
CREATE POLICY "Anyone can view enrichment logs"
  ON enrichment_logs FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert enrichment logs"
  ON enrichment_logs FOR INSERT
  WITH CHECK (true);

-- Enable pg_net extension for async HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create trigger function for auto-enrichment
CREATE OR REPLACE FUNCTION trigger_enrich_new_book()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to books table
DROP TRIGGER IF EXISTS on_book_insert_enrich ON books;
CREATE TRIGGER on_book_insert_enrich
  AFTER INSERT ON books
  FOR EACH ROW
  EXECUTE FUNCTION trigger_enrich_new_book();