import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contextType, contextId, currentBookData, limit = 4 } = await req.json();
    
    // Validate inputs
    if (!contextType || !['book', 'genre', 'mood'].includes(contextType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid context type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!contextId || (typeof contextId !== 'string' && typeof contextId !== 'number')) {
      return new Response(
        JSON.stringify({ error: 'Invalid context ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate and sanitize limit
    const sanitizedLimit = Math.min(Math.max(parseInt(limit) || 4, 1), 20);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    let recommendations: any[] = [];

    // Build prioritized queries based on context type
    if (contextType === 'book' && currentBookData) {
      // Priority 1: Exact trope match
      if (currentBookData.trope) {
        const { data } = await supabase
          .from('books')
          .select('*')
          .ilike('trope', `%${currentBookData.trope}%`)
          .neq('id', contextId)
          .limit(sanitizedLimit);
        if (data && data.length > 0) recommendations.push(...data);
      }

      // Priority 2: Shared mood + heat level
      if (recommendations.length < sanitizedLimit && currentBookData.mood && currentBookData.heat_level) {
        const { data } = await supabase
          .from('books')
          .select('*')
          .ilike('mood', `%${currentBookData.mood}%`)
          .eq('heat_level', currentBookData.heat_level)
          .neq('id', contextId)
          .limit(sanitizedLimit - recommendations.length);
        if (data) {
          const filtered = data.filter(b => !recommendations.find(r => r.id === b.id));
          recommendations.push(...filtered);
        }
      }

      // Priority 3: Same genre
      if (recommendations.length < sanitizedLimit && currentBookData.genre) {
        const { data } = await supabase
          .from('books')
          .select('*')
          .eq('genre', currentBookData.genre)
          .neq('id', contextId)
          .limit(sanitizedLimit - recommendations.length);
        if (data) {
          const filtered = data.filter(b => !recommendations.find(r => r.id === b.id));
          recommendations.push(...filtered);
        }
      }

      // Priority 4: Any one matching attribute
      if (recommendations.length < sanitizedLimit) {
        const { data } = await supabase
          .from('books')
          .select('*')
          .or(`mood.ilike.%${currentBookData.mood || ''}%,trope.ilike.%${currentBookData.trope || ''}%,genre.eq.${currentBookData.genre || ''}`)
          .neq('id', contextId)
          .limit(sanitizedLimit - recommendations.length);
        if (data) {
          const filtered = data.filter(b => !recommendations.find(r => r.id === b.id));
          recommendations.push(...filtered);
        }
      }
    } else if (contextType === 'genre') {
      // Fetch genre name
      const { data: genreData } = await supabase
        .from('genres')
        .select('name')
        .eq('id', contextId)
        .single();

      if (genreData) {
        const { data } = await supabase
          .from('books')
          .select('*')
          .eq('genre', genreData.name)
          .limit(sanitizedLimit);
        if (data) recommendations = data;
      }
    } else if (contextType === 'mood') {
      // Fetch mood name
      const { data: moodData } = await supabase
        .from('moods')
        .select('name')
        .eq('id', contextId)
        .single();

      if (moodData) {
        const { data } = await supabase
          .from('books')
          .select('*')
          .ilike('mood', `%${moodData.name}%`)
          .limit(sanitizedLimit);
        if (data) recommendations = data;
      }
    }

    // Limit results
    recommendations = recommendations.slice(0, sanitizedLimit);

    // Generate poetic lines using Lovable AI
    if (lovableApiKey && recommendations.length > 0) {
      const poeticPromises = recommendations.map(async (book) => {
        try {
          const contextPrompts: any = {
            book: `If you loved the ${currentBookData?.trope || 'romance'} in "${currentBookData?.title || 'this story'}", you'll melt for "${book.title}" by ${book.author}.`,
            genre: `This ${book.genre} gem will captivate you with its ${book.mood || 'romantic'} atmosphere.`,
            mood: `Perfect for when you're craving that ${book.mood || 'romantic'} feeling.`
          };

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
                  content: 'You are a poetic romance book curator. Create ONE beautiful, evocative sentence (15-25 words) that emotionally connects books. Use lyrical language like "longing", "melt", "captivate", "sweep". Be romantic and emotional.'
                },
                {
                  role: 'user',
                  content: `Create a poetic recommendation line for "${book.title}" by ${book.author}.
Context: ${contextPrompts[contextType]}
Book details: Genre: ${book.genre || 'Romance'}, Mood: ${book.mood || 'Romantic'}, Trope: ${book.trope || 'Love Story'}
Make it ONE sentence, romantic and evocative.`
                }
              ],
              max_completion_tokens: 50
            })
          });

          if (response.ok) {
            const data = await response.json();
            return data.choices?.[0]?.message?.content || contextPrompts[contextType];
          }
          return contextPrompts[contextType];
        } catch (error) {
          console.error('AI generation error:', error);
          // Fallback poetic line
          return `Discover the magic of "${book.title}" and let ${book.author} sweep you away into romance.`;
        }
      });

      const poeticLines = await Promise.all(poeticPromises);
      
      recommendations = recommendations.map((book, index) => ({
        ...book,
        poeticLine: poeticLines[index]
      }));
    } else {
      // Fallback without AI
      recommendations = recommendations.map((book) => ({
        ...book,
        poeticLine: `Discover the magic of "${book.title}" and let ${book.author} sweep you away into romance.`
      }));
    }

    return new Response(
      JSON.stringify({ recommendations }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-similar-books:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
