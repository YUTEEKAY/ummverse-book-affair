import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to clean book titles for better API search results
function cleanTitleForSearch(title: string): string {
  // Remove series info: (Series Name, #1), [Series Name #1], etc.
  return title
    .replace(/\s*\([^)]*#\d+[^)]*\)\s*/g, '')  // Remove (Series, #1)
    .replace(/\s*\[[^\]]*#\d+[^\]]*\]\s*/g, '')  // Remove [Series #1]
    .replace(/\s*#\d+\s*/g, '')                   // Remove standalone #1
    .trim();
}

// Helper function to detect English text
function isEnglishText(text: string): boolean {
  if (!text) return false;
  
  // Common non-English words/patterns that indicate non-English content
  const nonEnglishIndicators = [
    /\bà\b/i, /\bde la\b/i, /\beste\b/i, /\baprès\b/i,
    /\bétudiant/i, /\buniversité\b/i, /\bloin\b/i,
    /\bchez\b/i, /\bquand\b/i, /\bsans\b/i
  ];
  
  // If any non-English indicator is found, it's not English
  return !nonEnglishIndicators.some(pattern => pattern.test(text));
}

// Validate cover URL to ensure it's a valid image link (more lenient)
function isValidCoverUrl(url: string | null): boolean {
  if (!url) return false;
  
  // Check for valid http/https URL
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false;
  
  // More lenient - just check for valid domains
  const validDomains = [
    'covers.openlibrary.org',
    'books.google.com',
    'googleapis.com',
    'googleusercontent.com'
  ];
  
  return validDomains.some(domain => url.includes(domain));
}

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

    // Try multiple search strategies for better results
    const cleanedTitle = cleanTitleForSearch(title);
    const searches = [
      { title: title, author: author, label: "Full title + author" },
      { title: cleanedTitle, author: author, label: "Clean title + author" },
      { title: cleanedTitle, author: null, label: "Clean title only" }
    ];
    
    let olData: any = null;
    
    // Step 1: Try Open Library first with fallback strategy
    console.log(`[${title}] Fetching from Open Library with fallback...`);
    try {
      for (const search of searches) {
        if (!search.author && author) continue; // Skip author-less if we have author
        
        const olSearchTitle = encodeURIComponent(search.title);
        const olSearchAuthor = search.author ? encodeURIComponent(search.author) : '';
        const olQuery = search.author 
          ? `https://openlibrary.org/search.json?title=${olSearchTitle}&author=${olSearchAuthor}`
          : `https://openlibrary.org/search.json?title=${olSearchTitle}`;
        
        console.log(`[${title}] Open Library attempt (${search.label}): ${olQuery}`);
        
        const olResponse = await fetch(olQuery);
        olData = await olResponse.json();
        
        if (olData.docs && olData.docs.length > 0) {
          console.log(`[${title}] Open Library success with ${search.label}: ${olData.docs.length} results`);
          break;
        }
      }
      
      if (!olData || !olData.docs || olData.docs.length === 0) {
        console.log(`[${title}] Open Library: no results found after all attempts`);
      }

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
          const coverUrl = `https://covers.openlibrary.org/b/id/${firstResult.cover_i}-L.jpg`;
          if (isValidCoverUrl(coverUrl)) {
            bookData.cover_url = coverUrl;
            console.log(`[${title}] Open Library cover found: ${bookData.cover_url}`);
          } else {
            console.log(`[${title}] Open Library cover URL validation failed: ${coverUrl}`);
          }
        } else {
          console.log(`[${title}] Open Library: no cover_i found in result:`, JSON.stringify(firstResult).substring(0, 200));
        }
        
        bookData.api_source = 'open_library';
        console.log(`[${title}] Open Library data extraction complete`);
      } else {
        console.log(`[${title}] Open Library: no results found`);
      }
    } catch (error) {
      console.error(`[${title}] Open Library fetch error:`, error);
    }

    // Step 2: Fetch from Google Books (for description and as fallback) with language filtering
    console.log(`[${title}] Fetching from Google Books with fallback...`);
    let gbData: any = null;
    
    try {
      const googleApiKey = Deno.env.get('GOOGLE_BOOKS_API_KEY');
      
      if (!googleApiKey) {
        console.warn(`[${title}] Google Books API key not found`);
      } else {
        // Try multiple search strategies with language restriction
        for (const search of searches) {
          const gbSearchTitle = encodeURIComponent(search.title);
          const gbSearchAuthor = search.author ? encodeURIComponent(search.author) : '';
          const gbQuery = search.author
            ? `https://www.googleapis.com/books/v1/volumes?q=intitle:${gbSearchTitle}+inauthor:${gbSearchAuthor}&langRestrict=en&key=${googleApiKey}`
            : `https://www.googleapis.com/books/v1/volumes?q=intitle:${gbSearchTitle}&langRestrict=en&key=${googleApiKey}`;
          
          console.log(`[${title}] Google Books attempt (${search.label}): ${gbQuery.replace(googleApiKey, '[API_KEY]')}`);
          
          const gbResponse = await fetch(gbQuery);
          gbData = await gbResponse.json();
          
          if (gbData.items && gbData.items.length > 0) {
            console.log(`[${title}] Google Books success with ${search.label}: ${gbData.items.length} results`);
            break;
          }
        }
        
        if (!gbData || !gbData.items || !gbData.items.length) {
          console.log(`[${title}] Google Books: no results found after all attempts`);
        }

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
            const potentialCoverUrl = 
              volumeInfo.imageLinks?.extraLarge ||
              volumeInfo.imageLinks?.large ||
              volumeInfo.imageLinks?.medium ||
              volumeInfo.imageLinks?.thumbnail ||
              volumeInfo.imageLinks?.smallThumbnail ||
              null;
            
            if (potentialCoverUrl) {
              // Convert to https and higher quality
              const coverUrl = potentialCoverUrl.replace('http:', 'https:').replace('&edge=curl', '');
              if (isValidCoverUrl(coverUrl)) {
                bookData.cover_url = coverUrl;
                console.log(`[${title}] Google Books cover URL: ${bookData.cover_url}`);
              } else {
                console.log(`[${title}] Google Books cover URL validation failed: ${coverUrl}`);
              }
            } else {
              console.log(`[${title}] Google Books: no imageLinks found in volumeInfo`);
            }
            
            bookData.publisher = volumeInfo.publisher || null;
            bookData.page_count = volumeInfo.pageCount || null;
            bookData.api_source = 'google_books';
          }
          
          // Always use Google Books description (they have the best summaries) - validate it's English
          if (volumeInfo.description) {
            if (isEnglishText(volumeInfo.description)) {
              bookData.summary = volumeInfo.description;
              console.log(`[${title}] Google Books: English description found (${volumeInfo.description.length} chars)`);
              
              // If we got data from both sources, mark as hybrid
              if (bookData.api_source === 'open_library') {
                bookData.api_source = 'hybrid';
              }
            } else {
              console.log(`[${title}] Google Books: Rejected non-English description`);
            }
          } else {
            console.log(`[${title}] Google Books: no description found`);
          }
          
          // Enhance cover URL even if we got one from Open Library
          if (!bookData.cover_url || bookData.cover_url.includes('openlibrary')) {
            const potentialGbCoverUrl = 
              volumeInfo.imageLinks?.extraLarge ||
              volumeInfo.imageLinks?.large ||
              volumeInfo.imageLinks?.medium ||
              volumeInfo.imageLinks?.thumbnail ||
              volumeInfo.imageLinks?.smallThumbnail ||
              null;
            
            if (potentialGbCoverUrl) {
              const gbCoverUrl = potentialGbCoverUrl.replace('http:', 'https:').replace('&edge=curl', '');
              if (isValidCoverUrl(gbCoverUrl)) {
                bookData.cover_url = gbCoverUrl;
                console.log(`[${title}] Using Google Books cover instead: ${bookData.cover_url}`);
              }
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
