import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnrichmentRequest {
  batchSize?: number;
  startFrom?: number;
  targetBooks?: string[];
  forceRefresh?: boolean;
}

interface EnrichmentStats {
  totalProcessed: number;
  updated: number;
  noDataFound: number;
  errors: number;
  nextOffset: number;
  details: Array<{
    bookId: string;
    title: string;
    status: 'updated' | 'no_data' | 'error';
    message?: string;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      batchSize = 25,
      startFrom = 0,
      targetBooks = [],
      forceRefresh = false
    }: EnrichmentRequest = await req.json();

    console.log(`Starting enrichment: batchSize=${batchSize}, startFrom=${startFrom}, forceRefresh=${forceRefresh}`);

    // Build query for books that need enrichment
    let query = supabase
      .from('books')
      .select('id, title, author, summary, cover_url, api_source, publication_year, publisher');

    if (targetBooks.length > 0) {
      query = query.in('id', targetBooks);
    } else if (!forceRefresh) {
      // Only get books that need enrichment
      query = query.or('cover_url.is.null,summary.is.null,api_source.is.null');
    }

    query = query
      .range(startFrom, startFrom + batchSize - 1)
      .order('created_at', { ascending: true });

    const { data: books, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching books:', fetchError);
      throw fetchError;
    }

    if (!books || books.length === 0) {
      console.log('No books to process');
      return new Response(
        JSON.stringify({
          totalProcessed: 0,
          updated: 0,
          noDataFound: 0,
          errors: 0,
          nextOffset: startFrom,
          details: [],
          message: 'No books found to enrich'
        } as EnrichmentStats),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${books.length} books`);

    const stats: EnrichmentStats = {
      totalProcessed: 0,
      updated: 0,
      noDataFound: 0,
      errors: 0,
      nextOffset: startFrom + books.length,
      details: []
    };

    for (const book of books) {
      stats.totalProcessed++;
      console.log(`Processing: ${book.title} by ${book.author}`);

      try {
        // Check if we should skip this book
        const hasGenericSummary = book.summary?.includes('A romantic story full of emotions and unforgettable moments');
        const needsEnrichment = !book.cover_url || !book.summary || hasGenericSummary || !book.api_source || forceRefresh;

        if (!needsEnrichment) {
          console.log(`Skipping ${book.title} - already has good data`);
          stats.details.push({
            bookId: book.id,
            title: book.title,
            status: 'no_data',
            message: 'Already has complete data'
          });
          continue;
        }

        // Fetch book data from external APIs
        const bookDataResponse = await fetch(`${supabaseUrl}/functions/v1/fetch-book-data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({
            title: book.title,
            author: book.author,
            bookId: book.id,
            forceRefresh: forceRefresh
          })
        });

        if (!bookDataResponse.ok) {
          throw new Error(`API call failed: ${bookDataResponse.statusText}`);
        }

        const bookData = await bookDataResponse.json();
        console.log(`Fetched data for ${book.title}:`, bookData);

        // Prepare updates
        const updates: any = {
          api_source: bookData.apiSource || 'attempted'
        };

        let hasUpdates = false;

        // Update cover if found and missing
        if (bookData.coverUrl && !book.cover_url) {
          updates.cover_url = bookData.coverUrl;
          hasUpdates = true;
        }

        // Update summary if found and better than existing
        if (bookData.summary) {
          const shouldUpdateSummary = !book.summary || 
                                      hasGenericSummary || 
                                      bookData.summary.length > (book.summary?.length || 0);
          if (shouldUpdateSummary) {
            updates.summary = bookData.summary;
            hasUpdates = true;
          }
        }

        // Update publication year if missing
        if (bookData.publicationYear && !book.publication_year) {
          updates.publication_year = bookData.publicationYear;
          hasUpdates = true;
        }

        // Update publisher if found
        if (bookData.publisher && !book.publisher) {
          updates.publisher = bookData.publisher;
          hasUpdates = true;
        }

        // Update page count if found
        if (bookData.page_count && !book.page_count) {
          updates.page_count = bookData.page_count;
          hasUpdates = true;
        }

        if (hasUpdates) {
          const { error: updateError } = await supabase
            .from('books')
            .update(updates)
            .eq('id', book.id);

          if (updateError) {
            throw updateError;
          }

          // Log successful enrichment
          await supabase.from('enrichment_logs').insert({
            book_id: book.id,
            status: 'success',
            fields_updated: Object.keys(updates),
            data_source: bookData.api_source,
            error_message: null
          });

          stats.updated++;
          stats.details.push({
            bookId: book.id,
            title: book.title,
            status: 'updated',
            message: `Updated: ${Object.keys(updates).join(', ')}`
          });
          console.log(`✓ Updated ${book.title}`);
        } else {
          // Log skipped/no data
          await supabase.from('enrichment_logs').insert({
            book_id: book.id,
            status: bookData.api_source === 'not_found' ? 'failed' : 'skipped',
            fields_updated: [],
            data_source: bookData.api_source,
            error_message: bookData.api_source === 'not_found' ? 'No data found' : 'No new fields to update'
          });

          stats.noDataFound++;
          stats.details.push({
            bookId: book.id,
            title: book.title,
            status: 'no_data',
            message: 'No new data found'
          });
          console.log(`- No new data for ${book.title}`);
        }

        // Rate limiting: wait 500ms between API calls
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`Error processing ${book.title}:`, error);
        
        // Log error
        await supabase.from('enrichment_logs').insert({
          book_id: book.id,
          status: 'error',
          fields_updated: [],
          data_source: null,
          error_message: error instanceof Error ? error.message : 'Unknown error'
        });

        stats.errors++;
        stats.details.push({
          bookId: book.id,
          title: book.title,
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log('Enrichment complete:', stats);

    return new Response(
      JSON.stringify(stats),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in enrich-books function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
