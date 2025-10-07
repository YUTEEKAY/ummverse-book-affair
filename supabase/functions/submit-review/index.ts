import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookId, rating, review, nickname } = await req.json();

    // Validate input
    if (!bookId || !rating || !review) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (rating < 1 || rating > 5) {
      return new Response(
        JSON.stringify({ error: 'Rating must be between 1 and 5' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (review.length < 10 || review.length > 500) {
      return new Response(
        JSON.stringify({ error: 'Review must be between 10 and 500 characters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get user IP from headers
    const userIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                   req.headers.get('x-real-ip') || 
                   'unknown';

    console.log('Review submission from IP:', userIp);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if IP has submitted review for this book in last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: recentReview, error: checkError } = await supabase
      .from('reviews')
      .select('id')
      .eq('user_ip', userIp)
      .eq('book_id', bookId)
      .gte('created_at', oneDayAgo)
      .limit(1)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking recent reviews:', checkError);
    }

    if (recentReview) {
      return new Response(
        JSON.stringify({ 
          error: "You've already reviewed this book today. Come back tomorrow! 💕" 
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Insert review
    const { data, error: insertError } = await supabase
      .from('reviews')
      .insert({
        book_id: bookId,
        rating: rating,
        review_text: review,
        nickname: nickname || 'A Hopeless Romantic',
        user_ip: userIp,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting review:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to submit review. Please try again.' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Review submitted successfully:', data.id);

    return new Response(
      JSON.stringify({ data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in submit-review function:', error);
    return new Response(
      JSON.stringify({ error: 'Something went wrong. Please try again. 🌹' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
