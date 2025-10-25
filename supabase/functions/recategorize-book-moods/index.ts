import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Book {
  id: string;
  title: string;
  author: string;
  genre: string | null;
  heat_level: string | null;
  mood: string | null;
}

// Known book series that need specific mood assignments
const KNOWN_BOOKS: Record<string, { mood: string; heat_level?: string }> = {
  // Spicy & Steamy series
  'fifty shades': { mood: 'Spicy & Steamy', heat_level: 'scorching' },
  'crossfire': { mood: 'Spicy & Steamy', heat_level: 'scorching' },
  'bared to you': { mood: 'Spicy & Steamy', heat_level: 'scorching' },
  'reflected in you': { mood: 'Spicy & Steamy', heat_level: 'scorching' },
  'entwined with you': { mood: 'Spicy & Steamy', heat_level: 'scorching' },
  'beautiful bastard': { mood: 'Spicy & Steamy', heat_level: 'hot' },
  'beautiful stranger': { mood: 'Spicy & Steamy', heat_level: 'hot' },
  'beautiful player': { mood: 'Spicy & Steamy', heat_level: 'hot' },
  'beautiful bitch': { mood: 'Spicy & Steamy', heat_level: 'hot' },
  'beautiful secret': { mood: 'Spicy & Steamy', heat_level: 'hot' },
  'after': { mood: 'Spicy & Steamy', heat_level: 'hot' },
  'thoughtless': { mood: 'Spicy & Steamy', heat_level: 'hot' },
  
  // Dark & Intense series
  'black dagger brotherhood': { mood: 'Dark & Intense', heat_level: 'hot' },
  'lover awakened': { mood: 'Dark & Intense', heat_level: 'hot' },
  'lover eternal': { mood: 'Dark & Intense', heat_level: 'hot' },
  'lover enshrined': { mood: 'Dark & Intense', heat_level: 'hot' },
  'lover avenged': { mood: 'Dark & Intense', heat_level: 'hot' },
  'lover mine': { mood: 'Dark & Intense', heat_level: 'hot' },
  'darkest': { mood: 'Dark & Intense' },
  'twisted': { mood: 'Dark & Intense' },
  
  // Magical & Enchanting series
  'immortals after dark': { mood: 'Magical & Enchanting', heat_level: 'hot' },
  'a hunger like no other': { mood: 'Magical & Enchanting', heat_level: 'hot' },
  'kiss of midnight': { mood: 'Magical & Enchanting', heat_level: 'hot' },
  'dark needs at night': { mood: 'Magical & Enchanting', heat_level: 'hot' },
  'kiss of a demon king': { mood: 'Magical & Enchanting', heat_level: 'hot' },
  'pleasure of a dark prince': { mood: 'Magical & Enchanting', heat_level: 'hot' },
  'demon from the dark': { mood: 'Magical & Enchanting', heat_level: 'hot' },
  'lothaire': { mood: 'Magical & Enchanting', heat_level: 'hot' },
  'fever': { mood: 'Magical & Enchanting' },
  'psy-changeling': { mood: 'Magical & Enchanting' },
  'guild hunter': { mood: 'Magical & Enchanting' },
  'vampire academy': { mood: 'Magical & Enchanting' },
  'discovery of witches': { mood: 'Magical & Enchanting' },
  'anita blake': { mood: 'Magical & Enchanting' },
  'guilty pleasures': { mood: 'Magical & Enchanting' },
  'kate daniels': { mood: 'Magical & Enchanting' },
  'magic slays': { mood: 'Magical & Enchanting' },
  'magic study': { mood: 'Magical & Enchanting' },
  'poison study': { mood: 'Magical & Enchanting' },
  
  // Sweeping & Epic (Historical Romance authors)
  'lisa kleypas': { mood: 'Sweeping & Epic' },
  'julia quinn': { mood: 'Sweeping & Epic' },
  'bridgerton': { mood: 'Sweeping & Epic' },
  'duke': { mood: 'Sweeping & Epic' },
  'highlander': { mood: 'Sweeping & Epic' },
  'maya banks': { mood: 'Sweeping & Epic' },
  'mccabe': { mood: 'Sweeping & Epic' },
  'seduction of a highland': { mood: 'Sweeping & Epic' },
  'never love a highlander': { mood: 'Sweeping & Epic' },
  'spell of the highlander': { mood: 'Sweeping & Epic' },
  'the highwayman': { mood: 'Sweeping & Epic' },
};

function determineCorrectMood(book: Book): { mood: string; heat_level?: string } {
  const title = book.title?.toLowerCase() || '';
  const author = book.author?.toLowerCase() || '';
  const genre = book.genre?.toLowerCase() || '';
  const currentMood = book.mood?.toLowerCase() || '';
  
  // Force recategorization of legacy moods (Playful, Bittersweet)
  const legacyMoods = ['playful', 'bittersweet'];
  const isLegacyMood = legacyMoods.includes(currentMood);
  
  // Check known books first
  for (const [key, value] of Object.entries(KNOWN_BOOKS)) {
    if (title.includes(key) || author.includes(key)) {
      return value;
    }
  }
  
  // Heat-based categorization (scorching/hot = steamy)
  if (book.heat_level === 'scorching' || book.heat_level === 'hot') {
    return { mood: 'Spicy & Steamy' };
  }
  
  // Enhanced genre and title-based categorization
  const magicalKeywords = [
    'paranormal', 'fantasy', 'vampire', 'witch', 'magic', 'fae', 'shifter', 
    'werewolf', 'immortal', 'supernatural', 'dragon', 'demon', 'angel', 
    'psychic', 'urban fantasy', 'necromancer', 'sorcerer', 'mage'
  ];
  
  const historicalKeywords = [
    'historical', 'regency', 'medieval', 'victorian', 'highland', 'duke', 
    'earl', 'viscount', 'marquess', 'lord', 'lady', 'baron', 'laird',
    'scottish', 'tudor', 'georgian', 'wallflower'
  ];
  
  const darkKeywords = [
    'dark', 'suspense', 'thriller', 'mafia', 'biker', 'mc', 'hitman',
    'assassin', 'stalker', 'captive', 'kidnap', 'anti-hero', 'villain',
    'twisted', 'ruthless', 'dangerous'
  ];
  
  const spicyKeywords = [
    'erotica', 'erotic', 'explicit', 'steamy', 'sensual', 'seduction'
  ];
  
  // Check for spicy indicators
  for (const keyword of spicyKeywords) {
    if (genre.includes(keyword) || title.includes(keyword)) {
      return { mood: 'Spicy & Steamy', heat_level: 'hot' };
    }
  }
  
  // Check for magical/paranormal
  for (const keyword of magicalKeywords) {
    if (genre.includes(keyword) || title.includes(keyword)) {
      return { mood: 'Magical & Enchanting' };
    }
  }
  
  // Check for historical
  for (const keyword of historicalKeywords) {
    if (genre.includes(keyword) || title.includes(keyword)) {
      return { mood: 'Sweeping & Epic' };
    }
  }
  
  // Check for dark themes
  for (const keyword of darkKeywords) {
    if (genre.includes(keyword) || title.includes(keyword)) {
      return { mood: 'Dark & Intense' };
    }
  }
  
  // For legacy moods or sweet/contemporary romances, default to Cozy & Comforting
  if (isLegacyMood || book.heat_level === 'sweet' || book.heat_level === 'warm' || 
      genre.includes('contemporary') || genre.includes('romantic comedy') || 
      genre.includes('rom-com') || genre.includes('small town')) {
    return { mood: 'Cozy & Comforting' };
  }
  
  // Keep existing mood if none of the rules apply, or default
  return { mood: book.mood || 'Cozy & Comforting' };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
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
    console.log('🎭 Starting mood recategorization...');

    // Fetch all books
    const { data: books, error: fetchError } = await supabase
      .from('books')
      .select('id, title, author, genre, heat_level, mood');

    if (fetchError) {
      console.error('Error fetching books:', fetchError);
      throw fetchError;
    }

    console.log(`📚 Found ${books?.length || 0} books to recategorize`);

    let updated = 0;
    let unchanged = 0;
    const moodDistribution: Record<string, number> = {};

    // Process each book
    for (const book of books || []) {
      const result = determineCorrectMood(book as Book);
      const newMood = result.mood;
      const newHeatLevel = result.heat_level;
      
      // Track mood distribution
      moodDistribution[newMood] = (moodDistribution[newMood] || 0) + 1;
      
      // Only update if mood changed or heat level needs correction
      if (book.mood !== newMood || (newHeatLevel && book.heat_level !== newHeatLevel)) {
        const updateData: any = { mood: newMood };
        if (newHeatLevel) {
          updateData.heat_level = newHeatLevel;
        }
        
        const { error: updateError } = await supabase
          .from('books')
          .update(updateData)
          .eq('id', book.id);

        if (updateError) {
          console.error(`Error updating book ${book.id}:`, updateError);
        } else {
          console.log(`✅ Updated \"${book.title}\" from \"${book.mood}\" to \"${newMood}\"${newHeatLevel ? ` (heat: ${newHeatLevel})` : ''}`);
          updated++;
        }
      } else {
        unchanged++;
      }
    }

    console.log(`✨ Recategorization complete! Updated: ${updated}, Unchanged: ${unchanged}`);
    console.log('📊 New mood distribution:', moodDistribution);

    return new Response(
      JSON.stringify({
        success: true,
        totalBooks: books?.length || 0,
        updated,
        unchanged,
        moodDistribution,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in recategorize-book-moods:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
