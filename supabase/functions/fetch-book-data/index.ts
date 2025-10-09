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
    console.log('Fetching from Open Library...');
    try {
      const olQuery = searchAuthor 
        ? `https://openlibrary.org/search.json?title=${searchTitle}&author=${searchAuthor}`
        : `https://openlibrary.org/search.json?title=${searchTitle}`;
      
      const olResponse = await fetch(olQuery);
      const olData = await olResponse.json();

      if (olData.docs && olData.docs.length > 0) {
        const firstResult = olData.docs[0];
        
        // Extract basic info from Open Library
        bookData.title = firstResult.title || title;
        bookData.author = firstResult.author_name?.[0] || author || '';
        bookData.publication_year = firstResult.first_publish_year || null;
        bookData.publisher = firstResult.publisher?.[0] || null;
        bookData.page_count = firstResult.number_of_pages_median || null;
        
        // Build cover URL if available
        if (firstResult.cover_i) {
          bookData.cover_url = `https://covers.openlibrary.org/b/id/${firstResult.cover_i}-L.jpg`;
        }
        
        bookData.api_source = 'open_library';
        console.log('Open Library data found');
      }
    } catch (error) {
      console.error('Open Library fetch error:', error);
    }

    // Step 2: Fetch from Google Books (for description and as fallback)
    console.log('Fetching from Google Books...');
    try {
      const googleApiKey = Deno.env.get('GOOGLE_BOOKS_API_KEY');
      
      if (!googleApiKey) {
        console.warn('Google Books API key not found');
      } else {
        const gbQuery = searchAuthor
          ? `https://www.googleapis.com/books/v1/volumes?q=intitle:${searchTitle}+inauthor:${searchAuthor}&key=${googleApiKey}`
          : `https://www.googleapis.com/books/v1/volumes?q=intitle:${searchTitle}&key=${googleApiKey}`;
        
        const gbResponse = await fetch(gbQuery);
        const gbData = await gbResponse.json();

        if (gbData.items && gbData.items.length > 0) {
          const volumeInfo = gbData.items[0].volumeInfo;
          
          // If Open Library didn't find anything, use Google Books data
          if (bookData.api_source === 'not_found') {
            bookData.title = volumeInfo.title || title;
            bookData.author = volumeInfo.authors?.[0] || author || '';
            bookData.publication_year = volumeInfo.publishedDate 
              ? parseInt(volumeInfo.publishedDate.substring(0, 4)) 
              : null;
            bookData.cover_url = volumeInfo.imageLinks?.thumbnail || null;
            bookData.publisher = volumeInfo.publisher || null;
            bookData.page_count = volumeInfo.pageCount || null;
            bookData.api_source = 'google_books';
          }
          
          // Always use Google Books description (they have the best summaries)
          if (volumeInfo.description) {
            bookData.summary = volumeInfo.description;
            
            // If we got data from both sources, mark as hybrid
            if (bookData.api_source === 'open_library') {
              bookData.api_source = 'hybrid';
            }
          }
          
          // Extract page count and publisher if not already set
          if (!bookData.page_count && volumeInfo.pageCount) {
            bookData.page_count = volumeInfo.pageCount;
          }
          if (!bookData.publisher && volumeInfo.publisher) {
            bookData.publisher = volumeInfo.publisher;
          }
          
          console.log('Google Books data found');
        }
      }
    } catch (error) {
      console.error('Google Books fetch error:', error);
    }

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
