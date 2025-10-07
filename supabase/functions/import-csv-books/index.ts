import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CSVBook {
  title: string;
  author: string;
  genre: string;
  trope: string;
  mood: string;
  heat_level: string;
  summary: string;
  Publisher?: string;
  PublishYear?: string;
  Language?: string;
  Rating?: string;
}

interface ProcessedBook {
  title: string;
  author: string;
  genre: string;
  trope: string;
  mood: string;
  heat_level: string;
  summary: string;
  publisher?: string;
  publication_year?: number;
  language?: string;
  rating?: number;
  import_source: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { books, batchSize = 50 } = await req.json();
    
    if (!books || !Array.isArray(books)) {
      throw new Error('Invalid books array');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Processing ${books.length} books in batches of ${batchSize}`);

    let imported = 0;
    let skipped = 0;
    let rejected = 0;
    const errors: string[] = [];

    // Process in batches
    for (let i = 0; i < books.length; i += batchSize) {
      const batch = books.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(books.length / batchSize)}`);

      for (const book of batch) {
        try {
          // Clean and validate data
          const cleanedBook = await cleanAndValidateBook(book, lovableApiKey);
          
          if (!cleanedBook) {
            rejected++;
            console.log(`Rejected: ${book.title} - Not a romance novel`);
            continue;
          }

          // Check for duplicates
          const { data: existing } = await supabase
            .from('books')
            .select('id')
            .ilike('title', cleanedBook.title)
            .ilike('author', cleanedBook.author)
            .limit(1);

          if (existing && existing.length > 0) {
            skipped++;
            console.log(`Skipped duplicate: ${cleanedBook.title}`);
            continue;
          }

          // Insert book
          const { error: insertError } = await supabase
            .from('books')
            .insert([cleanedBook]);

          if (insertError) {
            errors.push(`${cleanedBook.title}: ${insertError.message}`);
            console.error(`Error inserting ${cleanedBook.title}:`, insertError);
          } else {
            imported++;
            console.log(`Imported: ${cleanedBook.title}`);
          }

        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`${book.title}: ${errorMsg}`);
          console.error(`Error processing ${book.title}:`, error);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        imported,
        skipped,
        rejected,
        errors: errors.slice(0, 100), // Limit error list
        message: `Import complete: ${imported} imported, ${skipped} skipped (duplicates), ${rejected} rejected (not romance)`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Import error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function cleanAndValidateBook(
  book: CSVBook, 
  lovableApiKey: string
): Promise<ProcessedBook | null> {
  // Clean HTML tags from summary
  const cleanSummary = book.summary
    ?.replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .trim() || '';

  // Use AI to validate if it's a romance novel
  const isRomance = await validateRomanceNovel(
    book.title,
    book.author,
    cleanSummary,
    book.genre,
    lovableApiKey
  );

  if (!isRomance) {
    return null;
  }

  // Normalize genre
  const normalizedGenre = normalizeGenre(book.genre);
  
  // Normalize trope
  const normalizedTrope = normalizeTrope(book.trope);
  
  // Normalize mood
  const normalizedMood = normalizeMood(book.mood);
  
  // Normalize heat level
  const normalizedHeatLevel = normalizeHeatLevel(book.heat_level);

  // Parse publication year
  const publicationYear = book.PublishYear 
    ? parseInt(book.PublishYear.toString()) 
    : undefined;

  // Parse rating
  const rating = book.Rating 
    ? parseFloat(book.Rating.toString()) 
    : undefined;

  return {
    title: book.title.trim(),
    author: book.author.trim(),
    genre: normalizedGenre,
    trope: normalizedTrope,
    mood: normalizedMood,
    heat_level: normalizedHeatLevel,
    summary: cleanSummary,
    publisher: book.Publisher?.trim(),
    publication_year: publicationYear,
    language: book.Language?.trim() || 'English',
    rating: rating,
    import_source: 'csv_import'
  };
}

async function validateRomanceNovel(
  title: string,
  author: string,
  summary: string,
  genre: string,
  lovableApiKey: string
): Promise<boolean> {
  // Quick genre check first
  const genreLower = genre.toLowerCase();
  const obviouslyNotRomance = [
    'puzzle', 'coloring', 'cookbook', 'children', 'kids',
    'activity', 'workbook', 'journal', 'diary', 'planner'
  ];
  
  if (obviouslyNotRomance.some(term => genreLower.includes(term))) {
    return false;
  }

  // If genre explicitly says romance, quick accept
  if (genreLower.includes('romance')) {
    return true;
  }

  // Use AI for ambiguous cases
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
            content: 'You are a book classifier. Respond with ONLY "YES" or "NO". A romance novel must have a romantic relationship as the CENTRAL plot focus, not just a subplot.'
          },
          {
            role: 'user',
            content: `Is this a romance novel?\n\nTitle: ${title}\nAuthor: ${author}\nGenre: ${genre}\nSummary: ${summary.slice(0, 500)}`
          }
        ],
        max_tokens: 10
      })
    });

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content?.trim().toUpperCase();
    return answer === 'YES';

  } catch (error) {
    console.error('AI validation error:', error);
    // On error, be conservative and accept if genre mentions romance
    return genreLower.includes('romance');
  }
}

function normalizeGenre(genre: string): string {
  const genreLower = genre.toLowerCase();
  
  const genreMap: Record<string, string> = {
    'contemporary romance': 'Contemporary Romance',
    'contemporary': 'Contemporary Romance',
    'historical romance': 'Historical Romance',
    'historical': 'Historical Romance',
    'fantasy romance': 'Fantasy Romance',
    'paranormal romance': 'Paranormal Romance',
    'paranormal': 'Paranormal Romance',
    'romantic suspense': 'Romantic Suspense',
    'suspense': 'Romantic Suspense',
    'romantic comedy': 'Romantic Comedy',
    'rom-com': 'Romantic Comedy',
    'new adult': 'New Adult Romance',
    'young adult': 'Young Adult Romance',
    'ya': 'Young Adult Romance',
    'regency': 'Regency Romance',
    'western': 'Western Romance',
    'sci-fi romance': 'Science Fiction Romance',
    'scifi': 'Science Fiction Romance'
  };

  for (const [key, value] of Object.entries(genreMap)) {
    if (genreLower.includes(key)) {
      return value;
    }
  }

  return genre.includes('Romance') ? genre : 'Contemporary Romance';
}

function normalizeTrope(trope: string): string {
  const tropeLower = trope.toLowerCase();
  
  const tropeMap: Record<string, string> = {
    'enemies to lovers': 'Enemies to Lovers',
    'enemy to lover': 'Enemies to Lovers',
    'second chance': 'Second Chance Romance',
    'second-chance': 'Second Chance Romance',
    'friends to lovers': 'Friends to Lovers',
    'friend to lover': 'Friends to Lovers',
    'fake relationship': 'Fake Relationship',
    'fake dating': 'Fake Relationship',
    'forced proximity': 'Forced Proximity',
    'grumpy sunshine': 'Grumpy/Sunshine',
    'grumpy/sunshine': 'Grumpy/Sunshine',
    'forbidden love': 'Forbidden Love',
    'forbidden romance': 'Forbidden Love',
    'age gap': 'Age Gap',
    'workplace': 'Workplace Romance',
    'office romance': 'Workplace Romance',
    'small town': 'Small Town Romance',
    'royalty': 'Royalty Romance',
    'billionaire': 'Billionaire Romance'
  };

  for (const [key, value] of Object.entries(tropeMap)) {
    if (tropeLower.includes(key)) {
      return value;
    }
  }

  return trope || 'Contemporary Romance';
}

function normalizeMood(mood: string): string {
  const moodLower = mood.toLowerCase();
  
  const moodMap: Record<string, string> = {
    'cozy': 'Cozy & Comforting',
    'comfort': 'Cozy & Comforting',
    'heartwarming': 'Cozy & Comforting',
    'spicy': 'Spicy & Steamy',
    'steamy': 'Spicy & Steamy',
    'hot': 'Spicy & Steamy',
    'dark': 'Dark & Intense',
    'intense': 'Dark & Intense',
    'angsty': 'Dark & Intense',
    'angst': 'Dark & Intense',
    'light': 'Light & Fun',
    'fun': 'Light & Fun',
    'funny': 'Light & Fun',
    'emotional': 'Emotional Journey',
    'tear-jerker': 'Emotional Journey',
    'adventure': 'Adventure & Action',
    'action': 'Adventure & Action'
  };

  for (const [key, value] of Object.entries(moodMap)) {
    if (moodLower.includes(key)) {
      return value;
    }
  }

  return mood || 'Contemporary Romance';
}

function normalizeHeatLevel(heatLevel: string): string {
  const heatLower = heatLevel.toLowerCase();
  
  if (heatLower.includes('sweet') || heatLower.includes('clean')) {
    return 'Sweet';
  } else if (heatLower.includes('mild') || heatLower.includes('warm')) {
    return 'Warm';
  } else if (heatLower.includes('spicy') || heatLower.includes('hot')) {
    return 'Spicy';
  } else if (heatLower.includes('very hot') || heatLower.includes('explicit')) {
    return 'Extra Spicy';
  }

  return heatLevel || 'Warm';
}
