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
    'googleusercontent.com',
    'archive.org'
  ];
  
  return validDomains.some(domain => url.includes(domain));
}

// Fetch from Internet Archive
async function fetchFromInternetArchive(title: string, author: string | null, internetArchiveKey: string) {
  try {
    const query = author 
      ? `title:"${title}" AND creator:"${author}"`
      : `title:"${title}"`;
    
    const searchUrl = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}&fl[]=identifier,title,creator,date,isbn,publisher&sort[]=downloads+desc&rows=5&page=1&output=json`;
    
    console.log(`[IA] Searching: ${searchUrl}`);
    
    const response = await fetch(searchUrl, {
      headers: {
        'Authorization': `LOW ${internetArchiveKey}`
      }
    });
    
    const data = await response.json();
    
    if (data.response?.docs && data.response.docs.length > 0) {
      const book = data.response.docs[0];
      return {
        identifier: book.identifier,
        isbn: book.isbn ? book.isbn[0] : null,
        coverUrl: book.identifier ? `https://archive.org/services/img/${book.identifier}` : null,
        title: book.title,
        author: book.creator ? book.creator[0] : null,
        publicationYear: book.date ? parseInt(book.date) : null,
        publisher: book.publisher ? book.publisher[0] : null
      };
    }
    
    return null;
  } catch (error) {
    console.error('[IA] Error:', error);
    return null;
  }
}

// Fetch Open Library cover by ISBN
async function fetchOpenLibraryCoverByISBN(isbn: string) {
  if (!isbn) return null;
  
  const sizes = ['L', 'M', 'S'];
  
  for (const size of sizes) {
    const coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-${size}.jpg`;
    
    try {
      const response = await fetch(coverUrl, { method: 'HEAD' });
      
      if (response.ok && response.headers.get('content-type')?.includes('image')) {
        console.log(`[OL-ISBN] Found cover for ISBN ${isbn}: ${coverUrl}`);
        return coverUrl;
      }
    } catch (error) {
      console.error(`[OL-ISBN] Error checking ${coverUrl}:`, error);
    }
  }
  
  return null;
}

// Extract ISBN from API responses
function extractISBN(olData: any, gbData: any) {
  let isbn = null;
  let isbn13 = null;
  
  // Try Open Library first
  if (olData?.docs?.[0]?.isbn) {
    const isbns = olData.docs[0].isbn;
    isbn13 = isbns.find((i: string) => i.length === 13);
    isbn = isbn13 || isbns[0];
  }
  
  // Try Google Books if not found
  if (!isbn && gbData?.items?.[0]?.volumeInfo?.industryIdentifiers) {
    const identifiers = gbData.items[0].volumeInfo.industryIdentifiers;
    const isbn13Obj = identifiers.find((id: any) => id.type === 'ISBN_13');
    const isbn10Obj = identifiers.find((id: any) => id.type === 'ISBN_10');
    
    isbn13 = isbn13Obj?.identifier;
    isbn = isbn13 || isbn10Obj?.identifier;
  }
  
  return { isbn, isbn13 };
}

interface BookData {
  title: string;
  author: string;
  summary: string | null;
  cover_url: string | null;
  publication_year: number | null;
  publisher: string | null;
  page_count: number | null;
  isbn: string | null;
  isbn13: string | null;
  api_source: 'open_library' | 'google_books' | 'hybrid' | 'internet_archive' | 'not_found';
  quotes: string[];
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
      isbn: null,
      isbn13: null,
      api_source: 'not_found',
      quotes: []
    };

    // Step 1: Try Internet Archive first
    const internetArchiveKey = Deno.env.get('Internet_Archive');
    let iaData = null;

    if (internetArchiveKey) {
      console.log(`[${title}] Fetching from Internet Archive...`);
      iaData = await fetchFromInternetArchive(title, author, internetArchiveKey);
      
      if (iaData) {
        console.log(`[${title}] Internet Archive found: ${iaData.identifier}`);
        bookData.cover_url = iaData.coverUrl;
        bookData.isbn = iaData.isbn;
        bookData.publication_year = iaData.publicationYear;
        bookData.publisher = iaData.publisher;
        bookData.api_source = 'internet_archive';
      }
    }

    // Try multiple search strategies for better results
    const cleanedTitle = cleanTitleForSearch(title);
    const searches = [
      { title: title, author: author, label: "Full title + author" },
      { title: cleanedTitle, author: author, label: "Clean title + author" },
      { title: cleanedTitle, author: null, label: "Clean title only" }
    ];
    
    let olData: any = null;
    
    // Step 2: Try Open Library with fallback strategy
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

    // Step 3: Fetch from Google Books (for description and as fallback) with language filtering
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
          
          // Extract quotes from searchInfo snippets if available
          if (gbData.items && gbData.items.length > 0) {
            const quotes: string[] = [];
            for (const item of gbData.items.slice(0, 3)) { // Check first 3 results
              if (item.searchInfo?.textSnippet) {
                const snippet = item.searchInfo.textSnippet
                  .replace(/<[^>]*>/g, '') // Remove HTML tags
                  .replace(/\.\.\./g, '')  // Remove ellipsis
                  .trim();
                
                // Only add if it's a substantial quote (50+ chars) and English
                if (snippet.length >= 50 && snippet.length <= 300 && isEnglishText(snippet)) {
                  quotes.push(snippet);
                }
              }
            }
            
            // Get up to 3 unique quotes
            bookData.quotes = [...new Set(quotes)].slice(0, 3);
            console.log(`[${title}] Extracted ${bookData.quotes.length} quotes from Google Books`);
          }
          
          console.log(`[${title}] Google Books data extraction complete`);
        } else {
          console.log(`[${title}] Google Books: no results found`);
        }
      }
    } catch (error) {
      console.error(`[${title}] Google Books fetch error:`, error);
    }
    
    // Step 4: Extract ISBN from all sources
    const { isbn, isbn13 } = extractISBN(olData, gbData);
    bookData.isbn = bookData.isbn || isbn;
    bookData.isbn13 = isbn13;
    
    // Step 5: Try ISBN-based Open Library cover if no cover yet
    if (!bookData.cover_url && (bookData.isbn || bookData.isbn13)) {
      console.log(`[${title}] Trying Open Library ISBN cover...`);
      const isbnToUse = bookData.isbn13 || bookData.isbn;
      if (isbnToUse) {
        const isbnCover = await fetchOpenLibraryCoverByISBN(isbnToUse);
        
        if (isbnCover) {
          bookData.cover_url = isbnCover;
          console.log(`[${title}] Found Open Library ISBN cover: ${isbnCover}`);
        }
      }
    }
    
    // Final result logging
    console.log(`[${title}] Final result - api_source: ${bookData.api_source}, has_cover: ${!!bookData.cover_url}, has_summary: ${!!bookData.summary}, isbn: ${bookData.isbn}`);

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
