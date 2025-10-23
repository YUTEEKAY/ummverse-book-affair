import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Book {
  id: string;
  title: string;
  author: string;
  summary: string | null;
  trope: string | null;
}

async function detectTropeFromSummary(
  title: string,
  summary: string,
  lovableApiKey: string
): Promise<string | null> {
  if (!summary || summary.length < 50) return null;
  
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
            content: 'You are a romance book expert. Analyze the summary and identify the PRIMARY trope. Respond with ONLY ONE of these exact values: "Enemies to Lovers", "Friends to Lovers", "Second Chance", "Fake Relationship", "Forced Proximity", "Grumpy/Sunshine", "Forbidden Love", or "Unknown" if none fit clearly.'
          },
          {
            role: 'user',
            content: `Book: ${title}\n\nSummary: ${summary.slice(0, 500)}\n\nWhat is the primary romance trope?`
          }
        ]
      })
    });

    if (!response.ok) {
      console.error('AI trope detection error:', response.status);
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
      return trope;
    }
    
    return null;
  } catch (error) {
    console.error('Trope detection error:', error);
    return null;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('📚 Starting trope recategorization...');

    // Fetch all books with summaries
    const { data: books, error: fetchError } = await supabase
      .from('books')
      .select('id, title, author, summary, trope')
      .not('summary', 'is', null);

    if (fetchError) {
      console.error('Error fetching books:', fetchError);
      throw fetchError;
    }

    console.log(`📖 Found ${books?.length || 0} books with summaries to analyze`);

    let updated = 0;
    let unchanged = 0;
    let noDetection = 0;
    const tropeDistribution: Record<string, number> = {};

    // Process each book
    for (const book of books || []) {
      try {
        const detectedTrope = await detectTropeFromSummary(
          book.title,
          book.summary || '',
          lovableApiKey
        );
        
        if (!detectedTrope) {
          noDetection++;
          console.log(`⚠️ No trope detected for: ${book.title}`);
          continue;
        }
        
        // Track trope distribution
        tropeDistribution[detectedTrope] = (tropeDistribution[detectedTrope] || 0) + 1;
        
        // Only update if trope changed
        if (book.trope !== detectedTrope) {
          const { error: updateError } = await supabase
            .from('books')
            .update({ trope: detectedTrope })
            .eq('id', book.id);

          if (updateError) {
            console.error(`Error updating book ${book.id}:`, updateError);
          } else {
            console.log(`✅ Updated "${book.title}" from "${book.trope}" to "${detectedTrope}"`);
            updated++;
          }
        } else {
          unchanged++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 150));
      } catch (error) {
        console.error(`Error processing ${book.title}:`, error);
      }
    }

    console.log(`✨ Trope recategorization complete! Updated: ${updated}, Unchanged: ${unchanged}, No detection: ${noDetection}`);
    console.log('📊 Trope distribution:', tropeDistribution);

    return new Response(
      JSON.stringify({
        success: true,
        totalBooks: books?.length || 0,
        updated,
        unchanged,
        noDetection,
        tropeDistribution,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in recategorize-book-tropes:', error);
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
