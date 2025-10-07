import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CategoryFilter {
  trope?: string;
  genre?: string;
  moodKeyword?: string;
  heatLevels?: string[];
}

const categoryFilters: Record<string, CategoryFilter> = {
  'enemies-to-lovers': { trope: 'Enemies to Lovers' },
  'second-chance': { trope: 'Second Chance' },
  'royal-fantasy': { genre: 'Fantasy Romance', moodKeyword: 'Fantasy' },
  'comfort-healing': { moodKeyword: 'Comforting' },
  'dark-obsession': { moodKeyword: 'Dark', heatLevels: ['hot', 'scorching'] }
};

const searchKeywords: Record<string, string> = {
  'enemies-to-lovers': 'enemies to lovers romance',
  'second-chance': 'second chance romance',
  'royal-fantasy': 'fantasy romance princess',
  'comfort-healing': 'heartwarming cozy romance',
  'dark-obsession': 'dark romance obsession'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category } = await req.json();
    console.log('Getting recommendations for category:', category);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const googleBooksKey = Deno.env.get('GOOGLE_BOOKS_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build database query
    const filters = categoryFilters[category] || {};
    let query = supabase.from('books').select('*');

    if (filters.trope) {
      query = query.ilike('trope', `%${filters.trope}%`);
    }
    if (filters.genre) {
      query = query.eq('genre', filters.genre);
    }
    if (filters.moodKeyword) {
      query = query.ilike('mood', `%${filters.moodKeyword}%`);
    }
    if (filters.heatLevels) {
      query = query.in('heat_level', filters.heatLevels);
    }

    const { data: dbBooks, error: dbError } = await query.limit(6);
    
    if (dbError) {
      console.error('Database query error:', dbError);
      throw dbError;
    }

    console.log(`Found ${dbBooks?.length || 0} books in database`);
    let allBooks = dbBooks || [];

    // Fetch from external APIs if needed
    if (allBooks.length < 3) {
      const keyword = searchKeywords[category];
      const needed = 6 - allBooks.length;
      
      try {
        const openLibraryUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(keyword)}&limit=${needed}`;
        const olResponse = await fetch(openLibraryUrl);
        const olData = await olResponse.json();

        const externalBooks = (olData.docs || []).slice(0, needed).map((book: any) => ({
          id: `ol-${book.key?.replace('/works/', '')}`,
          title: book.title || 'Untitled',
          author: book.author_name?.[0] || 'Unknown Author',
          cover_url: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg` : null,
          summary: book.first_sentence?.[0] || null,
          genre: 'Romance',
          mood: filters.moodKeyword || null,
          trope: filters.trope || null,
          heat_level: null,
          source: 'open_library'
        }));

        allBooks = [...allBooks, ...externalBooks];
        console.log(`Added ${externalBooks.length} books from Open Library`);
      } catch (apiError) {
        console.error('Error fetching from Open Library:', apiError);
      }
    }

    // Generate AI descriptions
    if (lovableApiKey && allBooks.length > 0) {
      console.log('Generating AI descriptions for', allBooks.length, 'books');
      
      const aiPromises = allBooks.map(async (book) => {
        try {
          const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${lovableApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                {
                  role: 'system',
                  content: 'You are a romance book expert. Create compelling, romantic 2-sentence hooks that make readers want to dive in. Be emotional, evocative, and capture the heart of the story. Keep it under 50 words total.'
                },
                {
                  role: 'user',
                  content: `Generate a 2-sentence "Why You'll Love It" hook for this romance book:
Title: ${book.title}
Author: ${book.author}
Genre: ${book.genre || 'Romance'}
Mood: ${book.mood || 'Romantic'}
Trope: ${book.trope || 'Love story'}`
                }
              ],
              max_tokens: 100
            })
          });

          if (response.ok) {
            const data = await response.json();
            book.whyYouLlLoveIt = data.choices?.[0]?.message?.content || 'A captivating romance that will sweep you off your feet and leave you believing in the power of love.';
          } else {
            throw new Error(`AI API returned ${response.status}`);
          }
        } catch (aiError) {
          console.error('Error generating AI description for', book.title, ':', aiError);
          book.whyYouLlLoveIt = 'A captivating romance that will sweep you off your feet and leave you believing in the power of love.';
        }
        return book;
      });

      allBooks = await Promise.all(aiPromises);
    } else {
      // Fallback descriptions
      allBooks = allBooks.map(book => ({
        ...book,
        whyYouLlLoveIt: 'A captivating romance that will sweep you off your feet and leave you believing in the power of love.'
      }));
    }

    console.log('Returning', allBooks.length, 'recommendations');

    return new Response(
      JSON.stringify({ recommendations: allBooks.slice(0, 6) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-recommendations function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
