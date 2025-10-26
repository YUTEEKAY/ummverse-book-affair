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
    // Get authenticated user and verify admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if user is admin
    const { data: isAdmin, error: roleError } = await supabase.rpc('has_role', { 
      _user_id: user.id, 
      _role: 'admin' 
    });

    if (roleError || !isAdmin) {
      console.log('Admin access denied for user:', user.id);
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Admin user authorized:', user.email);

    const {
      batchSize = 25,
      startFrom = 0,
      targetBooks = [],
      forceRefresh = false
    }: EnrichmentRequest = await req.json();

    console.log(`Admin ${user.email} starting enrichment: batchSize=${batchSize}, startFrom=${startFrom}, forceRefresh=${forceRefresh}`);

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

        // Validate the fetched book matches the requested book
        if (!validateBookMatch(
          book.title,
          book.author,
          bookData.title,
          bookData.author
        )) {
          console.log(`⚠️ Skipping ${book.title} - book mismatch detected`);
          
          await supabase.from('enrichment_logs').insert({
            book_id: book.id,
            status: 'skipped',
            data_source: 'validation_failed',
            error_message: 'Title/author mismatch - wrong book data'
          });

          stats.noDataFound++;
          stats.details.push({
            bookId: book.id,
            title: book.title,
            status: 'no_data',
            message: 'Validation failed - wrong book data'
          });
          continue;
        }

        // Helper function to detect non-English summaries
        const isEnglishText = (text: string): boolean => {
          if (!text) return false;
          const nonEnglishIndicators = [
            /\bà\b/i, /\bde la\b/i, /\beste\b/i, /\baprès\b/i,
            /\bétudiant/i, /\buniversité\b/i, /\bloin\b/i,
            /\bchez\b/i, /\bquand\b/i, /\bsans\b/i
          ];
          return !nonEnglishIndicators.some(pattern => pattern.test(text));
        };

        // Prepare updates
        const updates: any = {
          api_source: bookData.api_source || 'attempted'
        };

        let hasUpdates = false;

        // Update cover if found and missing
        if (bookData.cover_url && (!book.cover_url || book.cover_url === '')) {
          updates.cover_url = bookData.cover_url;
          hasUpdates = true;
          console.log(`Adding cover URL for: ${book.title}`);
        }

        // Update summary if found and better than existing
        if (bookData.summary) {
          const hasNonEnglishSummary = book.summary && !isEnglishText(book.summary);
          const shouldUpdateSummary = !book.summary || 
                                      hasGenericSummary || 
                                      hasNonEnglishSummary ||
                                      bookData.summary.length > (book.summary?.length || 0);
          if (shouldUpdateSummary) {
            updates.summary = bookData.summary;
            hasUpdates = true;
            if (hasNonEnglishSummary) {
              console.log(`Replacing non-English summary for: ${book.title}`);
            }
          }
        }

        // Update publication year if missing
        if (bookData.publication_year && !book.publication_year) {
          updates.publication_year = bookData.publication_year;
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

          // Store quotes if available
          if (bookData.quotes && bookData.quotes.length > 0) {
            for (const quoteText of bookData.quotes) {
              const { error: quoteError } = await supabase
                .from('quotes')
                .insert({
                  text: quoteText,
                  author: book.author,
                  book_title: book.title,
                  source: bookData.api_source
                });
              
              if (quoteError) {
                console.error(`Error inserting quote for ${book.title}:`, quoteError);
              }
            }
            console.log(`✓ Stored ${bookData.quotes.length} quotes for ${book.title}`);
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

// Validation helper functions
function validateBookMatch(
  requestedTitle: string,
  requestedAuthor: string,
  fetchedTitle: string | null,
  fetchedAuthor: string | null
): boolean {
  if (!fetchedTitle) return false;
  
  const normalizeForComparison = (str: string) => {
    return str
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };
  
  const reqTitle = normalizeForComparison(requestedTitle);
  const fetTitle = normalizeForComparison(fetchedTitle);
  
  const titleMatch = fetTitle.includes(reqTitle) || 
                    reqTitle.includes(fetTitle) ||
                    similarityScore(reqTitle, fetTitle) > 0.7;
  
  if (!titleMatch) {
    console.log(`❌ Title mismatch: "${requestedTitle}" vs "${fetchedTitle}"`);
    return false;
  }
  
  if (fetchedAuthor && requestedAuthor) {
    const reqAuthor = normalizeForComparison(requestedAuthor);
    const fetAuthor = normalizeForComparison(fetchedAuthor);
    
    const authorMatch = fetAuthor.includes(reqAuthor) || 
                       reqAuthor.includes(fetAuthor) ||
                       similarityScore(reqAuthor, fetAuthor) > 0.7;
    
    if (!authorMatch) {
      console.log(`⚠️ Author mismatch: "${requestedAuthor}" vs "${fetchedAuthor}"`);
      return reqTitle === fetTitle;
    }
  }
  
  return true;
}

function similarityScore(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => 
    Array(str1.length + 1).fill(null)
  );
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}
