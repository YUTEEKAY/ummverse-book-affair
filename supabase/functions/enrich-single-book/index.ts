import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { bookId, title, author } = await req.json();

    if (!bookId && (!title || !author)) {
      return new Response(
        JSON.stringify({ error: 'bookId or (title and author) required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch book data if we only have the ID
    let bookTitle = title;
    let bookAuthor = author;
    let bookRecord: any = null;

    if (bookId) {
      const { data: book, error: fetchError } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .single();

      if (fetchError || !book) {
        return new Response(
          JSON.stringify({ error: 'Book not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      bookRecord = book;
      bookTitle = book.title;
      bookAuthor = book.author;

      // Skip if already enriched (unless force refresh)
      if (book.api_source && book.api_source !== 'manual') {
        console.log(`Book ${bookTitle} already enriched with source: ${book.api_source}`);
        
        await supabase.from('enrichment_logs').insert({
          book_id: bookId,
          status: 'skipped',
          fields_updated: [],
          data_source: book.api_source,
          error_message: 'Already enriched'
        });

        return new Response(
          JSON.stringify({ 
            success: true, 
            updated: false,
            message: 'Book already enriched'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log(`Enriching: ${bookTitle} by ${bookAuthor}`);

    // Call fetch-book-data function
    const bookDataResponse = await fetch(`${supabaseUrl}/functions/v1/fetch-book-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        title: bookTitle,
        author: bookAuthor,
        bookId: bookId,
        forceRefresh: true
      })
    });

    if (!bookDataResponse.ok) {
      throw new Error(`fetch-book-data failed: ${bookDataResponse.statusText}`);
    }

    const bookData = await bookDataResponse.json();
    console.log('Fetched data:', bookData);

    // Prepare updates
    const updates: any = {
      api_source: bookData.api_source || 'attempted'
    };
    const fieldsUpdated: string[] = ['api_source'];

    if (bookData.cover_url && (!bookRecord?.cover_url || bookRecord.cover_url === '')) {
      updates.cover_url = bookData.cover_url;
      fieldsUpdated.push('cover_url');
    }

    if (bookData.summary) {
      const hasGenericSummary = bookRecord?.summary?.includes('A romantic story full of emotions');
      const shouldUpdate = !bookRecord?.summary || hasGenericSummary || 
                          bookData.summary.length > (bookRecord?.summary?.length || 0);
      if (shouldUpdate) {
        updates.summary = bookData.summary;
        fieldsUpdated.push('summary');
      }
    }

    if (bookData.publication_year && !bookRecord?.publication_year) {
      updates.publication_year = bookData.publication_year;
      fieldsUpdated.push('publication_year');
    }

    if (bookData.publisher && !bookRecord?.publisher) {
      updates.publisher = bookData.publisher;
      fieldsUpdated.push('publisher');
    }

    if (bookData.page_count && !bookRecord?.page_count) {
      updates.page_count = bookData.page_count;
      fieldsUpdated.push('page_count');
    }

    const hasUpdates = Object.keys(updates).length > 1; // More than just api_source

    if (hasUpdates && bookId) {
      const { error: updateError } = await supabase
        .from('books')
        .update(updates)
        .eq('id', bookId);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      // Log success
      await supabase.from('enrichment_logs').insert({
        book_id: bookId,
        status: 'success',
        fields_updated: fieldsUpdated,
        data_source: bookData.api_source,
        error_message: null
      });

      console.log(`✨ Successfully enriched: ${bookTitle}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          updated: true,
          fields: fieldsUpdated,
          message: `Updated ${fieldsUpdated.length} fields`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Log no data found
      if (bookId) {
        await supabase.from('enrichment_logs').insert({
          book_id: bookId,
          status: bookData.api_source === 'not_found' ? 'failed' : 'partial',
          fields_updated: fieldsUpdated,
          data_source: bookData.api_source,
          error_message: bookData.api_source === 'not_found' ? 'No data found from APIs' : 'No new fields to update'
        });
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          updated: false,
          message: 'No new data to update'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in enrich-single-book:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
