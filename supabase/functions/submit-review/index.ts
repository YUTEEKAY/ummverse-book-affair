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
    // Get authenticated user
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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

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

    const { bookId, rating, review, nickname } = await req.json();
    
    // Sanitize inputs to prevent XSS
    const sanitizeText = (text: string): string => {
      return text
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/[<>]/g, '') // Remove < and > characters
        .trim();
    };

    // Validate and sanitize inputs
    const sanitizedReview = review ? sanitizeText(review) : '';
    const sanitizedNickname = nickname ? sanitizeText(nickname).substring(0, 100) : 'A Hopeless Romantic';
    
    if (!bookId || !rating || !sanitizedReview) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate UUID format for bookId
    if (!bookId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return new Response(
        JSON.stringify({ error: 'Invalid book ID format' }),
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

    if (sanitizedReview.length < 10 || sanitizedReview.length > 5000) {
      return new Response(
        JSON.stringify({ error: 'Review must be between 10 and 5000 characters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get user IP from headers for additional rate limiting
    const userIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                   req.headers.get('x-real-ip') || 
                   'unknown';

    console.log('Review submission from user:', user.id);

    // Check if user has already reviewed this book
    const { data: existingReview, error: checkError } = await supabase
      .from('reviews')
      .select('id')
      .eq('user_id', user.id)
      .eq('book_id', bookId)
      .limit(1)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing reviews:', checkError);
    }

    if (existingReview) {
      return new Response(
        JSON.stringify({ 
          error: "You've already reviewed this book. You can edit your existing review instead. 💕" 
        }),
        { 
          status: 409, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Insert review with user_id
    const { data, error: insertError } = await supabase
      .from('reviews')
      .insert({
        book_id: bookId,
        user_id: user.id,
        rating: rating,
        review_text: sanitizedReview,
        nickname: sanitizedNickname,
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
