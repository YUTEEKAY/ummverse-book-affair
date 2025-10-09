import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload = await req.json();
    console.log('Received webhook:', JSON.stringify(payload, null, 2));

    const { meta, data } = payload;
    const eventName = meta?.event_name;

    if (!eventName) {
      throw new Error('Missing event_name in webhook payload');
    }

    // Extract customer email from payload
    const customerEmail = data?.attributes?.user_email || 
                         data?.attributes?.customer?.email;
    
    if (!customerEmail) {
      console.error('No customer email found in payload');
      return new Response(
        JSON.stringify({ error: 'Customer email not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find user by email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', customerEmail)
      .single();

    if (profileError || !profile) {
      console.error('User not found for email:', customerEmail);
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = profile.id;
    const subscriptionId = data?.attributes?.subscription_id || data?.id;

    // Handle different webhook events
    switch (eventName) {
      case 'subscription_created':
      case 'subscription_updated':
        await supabase
          .from('profiles')
          .update({
            is_premium: true,
            subscription_id: subscriptionId,
            subscription_status: 'active',
          })
          .eq('id', userId);
        
        console.log(`✅ Premium activated for user: ${userId}`);
        break;

      case 'subscription_cancelled':
        await supabase
          .from('profiles')
          .update({
            subscription_status: 'cancelled',
          })
          .eq('id', userId);
        
        console.log(`⚠️ Subscription cancelled for user: ${userId}`);
        break;

      case 'subscription_expired':
        await supabase
          .from('profiles')
          .update({
            is_premium: false,
            subscription_status: 'expired',
          })
          .eq('id', userId);
        
        console.log(`❌ Premium expired for user: ${userId}`);
        break;

      case 'subscription_paused':
        await supabase
          .from('profiles')
          .update({
            subscription_status: 'paused',
          })
          .eq('id', userId);
        
        console.log(`⏸️ Subscription paused for user: ${userId}`);
        break;

      case 'subscription_resumed':
        await supabase
          .from('profiles')
          .update({
            is_premium: true,
            subscription_status: 'active',
          })
          .eq('id', userId);
        
        console.log(`▶️ Subscription resumed for user: ${userId}`);
        break;

      default:
        console.log(`ℹ️ Unhandled event: ${eventName}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
