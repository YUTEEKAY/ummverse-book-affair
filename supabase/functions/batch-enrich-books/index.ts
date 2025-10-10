import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BatchEnrichRequest {
  bookIds?: string[];
  batchSize?: number;
  forceRefresh?: boolean;
}

interface EnrichmentResult {
  bookId: string;
  title: string;
  success: boolean;
  updated: boolean;
  fieldsUpdated: string[];
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookIds, batchSize = 50, forceRefresh = false } = await req.json() as BatchEnrichRequest;

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let query = supabase
      .from('books')
      .select('id, title, author, cover_url, summary, api_source');

    // Filter by specific book IDs if provided
    if (bookIds && bookIds.length > 0) {
      query = query.in('id', bookIds);
      console.log(`Enriching ${bookIds.length} specific books`);
    } else if (!forceRefresh) {
      // Only enrich books that need it (no api_source or missing data)
      query = query.or('api_source.is.null,cover_url.is.null,summary.is.null');
      console.log('Enriching books that need enrichment');
    } else {
      console.log('Force refreshing all books');
    }

    query = query.limit(batchSize);

    const { data: books, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch books: ${fetchError.message}`);
    }

    if (!books || books.length === 0) {
      return new Response(
        JSON.stringify({
          processed: 0,
          updated: 0,
          failed: 0,
          results: [],
          message: 'No books found to enrich'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${books.length} books for enrichment`);

    const results: EnrichmentResult[] = [];
    let updated = 0;
    let failed = 0;

    // Process each book
    for (const book of books) {
      try {
        console.log(`Enriching: ${book.title} by ${book.author}`);

        // Call the enrich-single-book function
        const { data: enrichData, error: enrichError } = await supabase.functions.invoke(
          'enrich-single-book',
          {
            body: {
              bookId: book.id,
              title: book.title,
              author: book.author,
              forceRefresh
            }
          }
        );

        if (enrichError) {
          console.error(`Error enriching ${book.title}:`, enrichError);
          results.push({
            bookId: book.id,
            title: book.title,
            success: false,
            updated: false,
            fieldsUpdated: [],
            error: enrichError.message
          });
          failed++;
        } else {
          const wasUpdated = enrichData?.updated || false;
          if (wasUpdated) updated++;

          results.push({
            bookId: book.id,
            title: book.title,
            success: true,
            updated: wasUpdated,
            fieldsUpdated: enrichData?.fields || [],
            error: undefined
          });

          console.log(`✓ ${book.title} - ${wasUpdated ? 'updated' : 'no changes needed'}`);
        }

        // Rate limiting: wait 300ms between requests
        await new Promise(resolve => setTimeout(resolve, 300));

      } catch (error: any) {
        console.error(`Exception enriching ${book.title}:`, error);
        results.push({
          bookId: book.id,
          title: book.title,
          success: false,
          updated: false,
          fieldsUpdated: [],
          error: error.message
        });
        failed++;
      }
    }

    const summary = {
      processed: books.length,
      updated,
      failed,
      results,
      message: `Processed ${books.length} books: ${updated} updated, ${failed} failed`
    };

    console.log('Batch enrichment complete:', summary.message);

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in batch-enrich-books function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
