import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BookData {
  title: string;
  author: string;
  summary: string | null;
  cover_url: string | null;
  publication_year: number | null;
  publisher: string | null;
  page_count: number | null;
  api_source: 'open_library' | 'google_books' | 'hybrid' | 'not_found';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, author, bookId, forceRefresh } = await req.json();

    if (!title) {
      return new Response(
        JSON.stringify({ error: 'Title is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache unless force refresh is requested
    if (!forceRefresh && bookId) {
      const { data: cachedBook } = await supabase
        .from('books')
        .select('title, author, summary, cover_url, publication_year, api_source')
        .eq('id', bookId)
        .single();

      if (cachedBook && cachedBook.api_source) {
        console.log('Returning cached book data');
        return new Response(
          JSON.stringify(cachedBook),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Prepare search query
    const searchTitle = encodeURIComponent(title.trim());
    const searchAuthor = author ? encodeURIComponent(author.trim()) : '';

    let bookData: BookData = {
      title,
      author: author || '',
      summary: null,
      cover_url: null,
      publication_year: null,
      publisher: null,
      page_count: null,
      api_source: 'not_found'
    };

    // Step 1: Try Open Library first
    console.log(`[${title}] Fetching from Open Library...`);
    try {
      const olQuery = searchAuthor 
        ? `https://openlibrary.org/search.json?title=${searchTitle}&author=${searchAuthor}`
        : `https://openlibrary.org/search.json?title=${searchTitle}`;
      
      console.log(`[${title}] Open Library query: ${olQuery}`);
      const olResponse = await fetch(olQuery);
      const olData = await olResponse.json();

      if (olData.docs && olData.docs.length > 0) {
        const firstResult = olData.docs[0];
        console.log(`[${title}] Open Library results: ${olData.docs.length} found`);
        
        // Extract basic info from Open Library
        bookData.title = firstResult.title || title;
        bookData.author = firstResult.author_name?.[0] || author || '';
        bookData.publication_year = firstResult.first_publish_year || null;
        bookData.publisher = firstResult.publisher?.[0] || null;
        bookData.page_count = firstResult.number_of_pages_median || null;
        
        // Build cover URL if available (try different sizes)
        if (firstResult.cover_i) {
          bookData.cover_url = `https://covers.openlibrary.org/b/id/${firstResult.cover_i}-L.jpg`;
          console.log(`[${title}] Open Library cover found: ${bookData.cover_url}`);
        } else {
          console.log(`[${title}] Open Library: no cover_i found`);
        }
        
        bookData.api_source = 'open_library';
        console.log(`[${title}] Open Library data extraction complete`);
      } else {
        console.log(`[${title}] Open Library: no results found`);
      }
    } catch (error) {
      console.error(`[${title}] Open Library fetch error:`, error);
    }

    // Step 2: Fetch from Google Books (for description and as fallback)
    console.log(`[${title}] Fetching from Google Books...`);
    try {
      const googleApiKey = Deno.env.get('GOOGLE_BOOKS_API_KEY');
      
      if (!googleApiKey) {
        console.warn(`[${title}] Google Books API key not found`);
      } else {
        const gbQuery = searchAuthor
          ? `https://www.googleapis.com/books/v1/volumes?q=intitle:${searchTitle}+inauthor:${searchAuthor}&key=${googleApiKey}`
          : `https://www.googleapis.com/books/v1/volumes?q=intitle:${searchTitle}&key=${googleApiKey}`;
        
        console.log(`[${title}] Google Books query: ${gbQuery.replace(googleApiKey, '[API_KEY]')}`);
        const gbResponse = await fetch(gbQuery);
        const gbData = await gbResponse.json();

        if (gbData.items && gbData.items.length > 0) {
          console.log(`[${title}] Google Books: ${gbData.items.length} results found`);
          const volumeInfo = gbData.items[0].volumeInfo;
          
          // Log available image links
          if (volumeInfo.imageLinks) {
            console.log(`[${title}] Google Books image links:`, Object.keys(volumeInfo.imageLinks));
          } else {
            console.log(`[${title}] Google Books: no imageLinks found`);
          }
          
          // If Open Library didn't find anything, use Google Books data
          if (bookData.api_source === 'not_found') {
            bookData.title = volumeInfo.title || title;
            bookData.author = volumeInfo.authors?.[0] || author || '';
            bookData.publication_year = volumeInfo.publishedDate 
              ? parseInt(volumeInfo.publishedDate.substring(0, 4)) 
              : null;
            
            // Try multiple cover sizes in order of preference
            bookData.cover_url = 
              volumeInfo.imageLinks?.extraLarge ||
              volumeInfo.imageLinks?.large ||
              volumeInfo.imageLinks?.medium ||
              volumeInfo.imageLinks?.thumbnail ||
              volumeInfo.imageLinks?.smallThumbnail ||
              null;
            
            if (bookData.cover_url) {
              // Convert to https and higher quality
              bookData.cover_url = bookData.cover_url.replace('http:', 'https:').replace('&edge=curl', '');
              console.log(`[${title}] Google Books cover URL: ${bookData.cover_url}`);
            }
            
            bookData.publisher = volumeInfo.publisher || null;
            bookData.page_count = volumeInfo.pageCount || null;
            bookData.api_source = 'google_books';
          }
          
          // Always use Google Books description (they have the best summaries)
          if (volumeInfo.description) {
            bookData.summary = volumeInfo.description;
            console.log(`[${title}] Google Books: description found (${volumeInfo.description.length} chars)`);
            
            // If we got data from both sources, mark as hybrid
            if (bookData.api_source === 'open_library') {
              bookData.api_source = 'hybrid';
            }
          } else {
            console.log(`[${title}] Google Books: no description found`);
          }
          
          // Enhance cover URL even if we got one from Open Library
          if (!bookData.cover_url || bookData.cover_url.includes('openlibrary')) {
            const gbCoverUrl = 
              volumeInfo.imageLinks?.extraLarge ||
              volumeInfo.imageLinks?.large ||
              volumeInfo.imageLinks?.medium ||
              volumeInfo.imageLinks?.thumbnail ||
              volumeInfo.imageLinks?.smallThumbnail ||
              null;
            
            if (gbCoverUrl) {
              bookData.cover_url = gbCoverUrl.replace('http:', 'https:').replace('&edge=curl', '');
              console.log(`[${title}] Using Google Books cover instead: ${bookData.cover_url}`);
            }
          }
          
          // Extract page count and publisher if not already set
          if (!bookData.page_count && volumeInfo.pageCount) {
            bookData.page_count = volumeInfo.pageCount;
          }
          if (!bookData.publisher && volumeInfo.publisher) {
            bookData.publisher = volumeInfo.publisher;
          }
          
          console.log(`[${title}] Google Books data extraction complete`);
        } else {
          console.log(`[${title}] Google Books: no results found`);
        }
      }
    } catch (error) {
      console.error(`[${title}] Google Books fetch error:`, error);
    }
    
    // Final result logging
    console.log(`[${title}] Final result - api_source: ${bookData.api_source}, has_cover: ${!!bookData.cover_url}, has_summary: ${!!bookData.summary}`);

    // Return the combined data
    return new Response(
      JSON.stringify(bookData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in fetch-book-data function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
