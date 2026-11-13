import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CSVBook {
  id?: string;
  title: string;          // REQUIRED
  author: string;         // REQUIRED
  summary?: string;       // REQUIRED for AI trope detection
  heat_level?: string;    // REQUIRED
  mood?: string;          // REQUIRED
  genre?: string;         // Optional
  trope?: string;         // Optional (will be AI-detected)
  tropes?: string;
  moods?: string;
  cover_url?: string;
  publisher?: string;
  publish_year?: string;
  isbn?: string;
  language?: string;
  page_count?: string;
  rating?: string;
  description?: string;
  quote_snippet?: string;
  source_api?: string;
  // Legacy fields from old CSV formats
  'release year'?: string;
  synopsis?: string;
  Publisher?: string;
  PublishYear?: string;
  Language?: string;
  Rating?: string;
}

interface ProcessedBook {
  title: string;
  author: string;
  genre: string | null;
  trope: string | null;
  mood: string | null;
  heat_level: string | null;
  summary: string | null;
  api_source?: string;
  cover_url?: string | null;
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
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
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

    const { books, batchSize = 50 } = await req.json();
    
    if (!books || !Array.isArray(books)) {
      throw new Error('Invalid books array');
    }

    console.log(`Admin ${user.email} processing ${books.length} books in batches of ${batchSize}`);

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
          // Validate required fields
          if (!book.title || !book.author) {
            errors.push(`Missing title or author for row`);
            continue;
          }
          
          const rawSummary = book.description || book.summary || book.synopsis || '';
          if (!rawSummary || rawSummary.length < 50) {
            errors.push(`${book.title}: Summary too short or missing (need at least 50 characters for AI analysis)`);
            continue;
          }

          // Clean and validate data
          const cleanedBook = await cleanAndValidateBook(book, lovableApiKey);
          
          if (!cleanedBook) {
            rejected++;
            console.log(`Rejected: ${book.title} - Not a romance novel`);
            continue;
          }

          // Check for duplicates - ignore format suffixes in comparison
          const titleForComparison = cleanedBook.title
            .replace(/\s*\([^)]*\)$/g, '')
            .trim();
          
          const { data: existing } = await supabase
            .from('books')
            .select('id')
            .ilike('title', titleForComparison)
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
  // Prefer description over summary (description field has more detailed content)
  const rawSummary = book.description || book.summary || book.synopsis || '';
  
  // Clean HTML tags and entities from summary
  const cleanSummary = rawSummary
    ?.replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim() || null;

  // Clean title: remove format suffixes like "(Paperback)", "(Kindle Edition)", etc.
  const cleanTitle = book.title
    .replace(/\s*\([^)]*Edition\)$/gi, '')
    .replace(/\s*\((Paperback|Hardcover|Mass Market|Audio CD)\)$/gi, '')
    .trim();

  // Use AI to validate if it's a romance novel
  // Skip expensive AI validation if genre is explicitly "Romance"
  const isRomance = await validateRomanceNovel(
    cleanTitle,
    book.author,
    cleanSummary || '',
    book.genre || '',
    lovableApiKey
  );

  if (!isRomance) {
    return null;
  }

  // Use AI to detect trope from summary
  const detectedTrope = await detectTropeFromSummary(
    cleanTitle,
    cleanSummary || '',
    lovableApiKey
  );

  // Use AI to detect heat level from summary if not provided
  const detectedHeatLevel = !book.heat_level ? await detectHeatLevelFromSummary(
    cleanTitle,
    cleanSummary || '',
    lovableApiKey
  ) : null;

  // Normalize fields only if they exist
  const normalizedGenre = book.genre ? normalizeGenre(book.genre) : null;
  const rawTrope = (book.trope || book.tropes || '').split(/[;|]/)[0].trim();
  const csvTrope = rawTrope ? normalizeTrope(rawTrope) : null;
  const finalTrope = csvTrope || detectedTrope; // The admin's own trope wins
  const rawMood = book.mood || book.moods || '';
  const normalizedMood = rawMood ? normalizeMood(rawMood) : null;
  const csvHeatLevel = book.heat_level ? normalizeHeatLevel(book.heat_level) : null;
  const finalHeatLevel = csvHeatLevel || detectedHeatLevel;
  const coverUrl = (book.cover_url || '').trim();

  // Parse publication year - support multiple field names
  const yearString = book.publish_year || book.PublishYear || book['release year'];
  const publicationYear = yearString 
    ? parseInt(yearString.toString()) 
    : undefined;

  // Parse rating - support multiple field names
  const ratingString = book.rating || book.Rating;
  const rating = ratingString 
    ? parseFloat(ratingString.toString()) 
    : undefined;

  // Use source_api if provided, otherwise default to 'csv_import'
  const importSource = book.source_api || 'csv_import';

  return {
    title: cleanTitle,
    author: book.author.trim(),
    genre: normalizedGenre,
    trope: finalTrope,
    mood: normalizedMood,
    heat_level: finalHeatLevel,
    summary: cleanSummary,
    publisher: (book.publisher || book.Publisher)?.trim(),
    publication_year: publicationYear,
    language: (book.language || book.Language)?.trim() || 'English',
    rating: rating,
    import_source: importSource,
    api_source: 'csv_import',
    cover_url: /^https?:\/\//.test(coverUrl) ? coverUrl : null
  };
}

async function detectTropeFromSummary(
  title: string,
  summary: string,
  lovableApiKey: string
): Promise<string | null> {
  if (!summary || summary.length < 50) {
    console.log(`⚠️ Summary too short for trope detection: "${title}"`);
    return null;
  }
  
  try {
    console.log(`🔍 Detecting trope for: "${title}"`);
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
            content: 'You are a romance book expert. Analyze the summary and identify the PRIMARY trope. Respond with ONLY ONE of these exact values: "Enemies to Lovers", "Friends to Lovers", "Second Chance", "Fake Relationship", "Forced Proximity", "Grumpy/Sunshine", "Forbidden Love", or "Unknown" if none fit clearly.'
          },
          {
            role: 'user',
            content: `Book: ${title}\n\nSummary: ${summary.slice(0, 500)}\n\nWhat is the primary romance trope?`
          }
        ],
        max_completion_tokens: 50
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ AI trope detection error for "${title}":`, response.status, errorText);
      return null;
    }

    const data = await response.json();
    const trope = data.choices?.[0]?.message?.content?.trim();
    
    // Validate response is one of our known tropes
    const validTropes = [
      'Enemies to Lovers',
      'Friends to Lovers',
      'Second Chance',
      'Fake Relationship',
      'Forced Proximity',
      'Grumpy/Sunshine',
      'Forbidden Love'
    ];
    
    if (validTropes.includes(trope)) {
      console.log(`✅ AI detected trope for "${title}": ${trope}`);
      return trope;
    }
    
    console.log(`⚠️ AI returned unknown trope for "${title}": "${trope}"`);
    return null;
  } catch (error) {
    console.error(`❌ Trope detection error for "${title}":`, error);
    return null;
  }
}

async function detectHeatLevelFromSummary(
  title: string,
  summary: string,
  lovableApiKey: string
): Promise<string | null> {
  if (!summary || summary.length < 50) {
    console.log(`⚠️ Summary too short for heat level detection: "${title}"`);
    return null;
  }
  
  try {
    console.log(`🔍 Detecting heat level for: "${title}"`);
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
            content: 'You are a romance book expert. Analyze the summary and determine the heat/spice level. Respond with ONLY ONE of these exact values:\n- "sweet" for clean romance with no explicit content\n- "warm" for mild romance with some kissing/tension\n- "hot" for steamy romance with explicit scenes\n- "scorching" for very explicit/erotic romance'
          },
          {
            role: 'user',
            content: `Book: ${title}\n\nSummary: ${summary.slice(0, 500)}\n\nWhat is the heat/spice level?`
          }
        ],
        max_completion_tokens: 20
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ AI heat level detection error for "${title}":`, response.status, errorText);
      return null;
    }

    const data = await response.json();
    const heatLevel = data.choices?.[0]?.message?.content?.trim().toLowerCase();
    
    // Validate response is one of our known heat levels
    const validHeatLevels = ['sweet', 'warm', 'hot', 'scorching'];
    
    if (validHeatLevels.includes(heatLevel)) {
      console.log(`✅ AI detected heat level for "${title}": ${heatLevel}`);
      return heatLevel;
    }
    
    console.log(`⚠️ AI returned unknown heat level for "${title}": "${heatLevel}", defaulting to warm`);
    return 'warm'; // Default fallback
  } catch (error) {
    console.error(`❌ Heat level detection error for "${title}":`, error);
    return 'warm'; // Default fallback on error
  }
}

async function validateRomanceNovel(
  title: string,
  author: string,
  summary: string,
  genre: string,
  lovableApiKey: string
): Promise<boolean> {
  // Trust the admin's genre when it already says romance (e.g. "Dark Romance", "Romantasy")
  if (/roman/i.test(genre)) return true;
  // If genre is provided, do quick checks
  if (genre) {
    const genreLower = genre.toLowerCase();
    const obviouslyNotRomance = [
      'puzzle', 'coloring', 'cookbook', 'children', 'kids',
      'activity', 'workbook', 'journal', 'diary', 'planner'
    ];
    
    if (obviouslyNotRomance.some(term => genreLower.includes(term))) {
      return false;
    }

    // If genre is exactly "Romance" (pre-labeled), skip expensive AI validation
    if (genreLower === 'romance' || genreLower.includes('romance')) {
      console.log(`Quick accept: ${title} - Pre-labeled as romance`);
      return true;
    }
  }

  // Use AI for ambiguous cases or when no genre is provided
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
            content: `Is this a romance novel?\n\nTitle: ${title}\nAuthor: ${author}${genre ? `\nGenre: ${genre}` : ''}${summary ? `\nSummary: ${summary.slice(0, 500)}` : ''}`
          }
        ],
        max_completion_tokens: 10
      })
    });

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content?.trim().toUpperCase();
    return answer === 'YES';

  } catch (error) {
    console.error('AI validation error:', error);
    // On error, be conservative - accept if genre mentions romance or if no genre provided
    return genre ? genre.toLowerCase().includes('romance') : true;
  }
}

function normalizeGenre(genre: string): string {
  const genreLower = genre.toLowerCase();
  
  const genreMap: Record<string, string> = {
    'romantasy': 'Fantasy Romance',
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
  const m = mood.toLowerCase();
  const rules: [string, string[]][] = [
    ['Spicy & Steamy', ['spicy', 'steamy', 'sizzling', 'seductive', 'sensual', 'passionate', 'sultry']],
    ['Dark & Intense', ['dark', 'intense', 'obsessive', 'macabre', 'vengeful', 'brooding', 'suspense', 'thrill', 'eerie', 'gothic', 'possessive', 'volatile', 'gripping']],
    ['Magical & Enchanting', ['magic', 'enchant', 'mythic', 'fae', 'whimsical', 'lush']],
    ['Sweeping & Epic', ['epic', 'sweeping', 'high stakes', 'adrenaline', 'action', 'fierce']],
    ['Bittersweet', ['bittersweet', 'devastating', 'poignant', 'emotional', 'angsty', 'tear', 'soulful']],
    ['Playful', ['playful', 'witty', 'funny', 'comedy', 'chaotic', 'sparkling', 'charming', 'joyful', 'banter']],
    ['Cozy & Comforting', ['cozy', 'comfort', 'heartwarming', 'heartfelt', 'sweet', 'relatable', 'tender']],
  ];
  // Use the first listed mood that matches, so "Witty; Heartwarming" -> Playful
  for (const part of m.split(/[;|,]/).map(x => x.trim()).filter(Boolean)) {
    for (const [name, keys] of rules) if (keys.some(k => part.includes(k))) return name;
  }
  return 'Cozy & Comforting';
}

function normalizeHeatLevel(heatLevel: string): string {
  const h = heatLevel.toLowerCase().trim();
  const num = h.match(/^(\d)(?:\s*\/\s*5)?/);
  if (num) {
    const n = Number(num[1]);
    return n <= 2 ? 'sweet' : n === 3 ? 'warm' : n === 4 ? 'hot' : 'scorching';
  }
  if (/scorch|inferno|very hot|extreme/.test(h)) return 'scorching';
  if (/explicit|spicy|hot|steam/.test(h)) return 'hot';
  if (/sweet|clean|closed/.test(h)) return 'sweet';
  return 'warm';
}
