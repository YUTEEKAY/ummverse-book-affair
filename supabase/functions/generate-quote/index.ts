import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QuoteResponse {
  text: string;
  author: string;
  book_title: string;
  book_id: string | null;
}

const fallbackQuotes: QuoteResponse[] = [
  {
    text: "You are my heart, my life, my one and only thought.",
    author: "Arthur Conan Doyle",
    book_title: "The White Company",
    book_id: null
  },
  {
    text: "Whatever our souls are made of, his and mine are the same.",
    author: "Emily Brontë",
    book_title: "Wuthering Heights",
    book_id: null
  },
  {
    text: "I would rather share one lifetime with you than face all the ages of this world alone.",
    author: "J.R.R. Tolkien",
    book_title: "The Lord of the Rings",
    book_id: null
  },
  {
    text: "I have waited for this opportunity for more than half a century, to repeat to you once again my vow of eternal fidelity and everlasting love.",
    author: "Gabriel García Márquez",
    book_title: "Love in the Time of Cholera",
    book_id: null
  },
  {
    text: "I wish you to know that you have been the last dream of my soul.",
    author: "Charles Dickens",
    book_title: "A Tale of Two Cities",
    book_id: null
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Get a random enriched book
    const { data: books, error: booksError } = await supabase
      .from('books')
      .select('id, title, author')
      .not('api_source', 'is', null)
      .limit(100);

    if (booksError) {
      console.error('Error fetching books:', booksError);
      return new Response(
        JSON.stringify(fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)]),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!books || books.length === 0) {
      console.log('No enriched books found, using fallback');
      return new Response(
        JSON.stringify(fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)]),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Select a random book
    const randomBook = books[Math.floor(Math.random() * books.length)];
    console.log('Selected book:', randomBook.title, 'by', randomBook.author);

    // Step 2: Check if quotes exist in cache for this book
    const { data: cachedQuotes, error: quotesError } = await supabase
      .from('quotes')
      .select('*')
      .ilike('book_title', `%${randomBook.title}%`);

    if (!quotesError && cachedQuotes && cachedQuotes.length > 0) {
      console.log(`Found ${cachedQuotes.length} cached quotes for ${randomBook.title}`);
      const randomQuote = cachedQuotes[Math.floor(Math.random() * cachedQuotes.length)];
      
      return new Response(
        JSON.stringify({
          text: randomQuote.text,
          author: randomQuote.author,
          book_title: randomQuote.book_title,
          book_id: randomBook.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: No cached quotes, fetch from API
    console.log('No cached quotes, fetching from API for:', randomBook.title);
    
    const { data: bookData, error: fetchError } = await supabase.functions.invoke('fetch-book-data', {
      body: { 
        title: randomBook.title, 
        author: randomBook.author,
        bookId: randomBook.id 
      }
    });

    if (fetchError || !bookData) {
      console.error('Error fetching book data:', fetchError);
      return new Response(
        JSON.stringify(fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)]),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 4: Extract and store quotes if available
    if (bookData.quotes && bookData.quotes.length > 0) {
      console.log(`Found ${bookData.quotes.length} quotes from API`);
      
      // Store quotes in cache (best effort, don't fail if this fails)
      for (const quoteText of bookData.quotes) {
        const { error: insertError } = await supabase.from('quotes').insert({
          text: quoteText,
          author: randomBook.author,
          book_title: randomBook.title,
          source: bookData.source || 'API'
        });
        if (insertError) {
          console.error('Error storing quote:', insertError);
        }
      }

      // Return a random quote from the fetched quotes
      const randomQuoteText = bookData.quotes[Math.floor(Math.random() * bookData.quotes.length)];
      
      return new Response(
        JSON.stringify({
          text: randomQuoteText,
          author: randomBook.author,
          book_title: randomBook.title,
          book_id: randomBook.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 5: No quotes found anywhere, use fallback
    console.log('No quotes found from API, using fallback');
    return new Response(
      JSON.stringify(fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)]),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-quote function:', error);
    return new Response(
      JSON.stringify(fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)]),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});
