import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const webhookSecret = Deno.env.get('LEMON_SQUEEZY_WEBHOOK_SECRET');
    const premiumVariantId = Deno.env.get('LEMON_SQUEEZY_PREMIUM_VARIANT_ID')!;
    const lifetimeVariantId = Deno.env.get('LEMON_SQUEEZY_LIFETIME_VARIANT_ID')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get raw body for signature verification
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody);
    
    // Verify webhook signature if secret is configured
    if (webhookSecret) {
      const signature = req.headers.get('X-Signature');
      if (signature) {
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
          'raw',
          encoder.encode(webhookSecret),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        );
        
        const expectedSignature = await crypto.subtle.sign(
          'HMAC',
          key,
          encoder.encode(rawBody)
        );
        
        const expectedSignatureHex = Array.from(new Uint8Array(expectedSignature))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        
        if (signature !== expectedSignatureHex) {
          console.error('Invalid webhook signature');
          return new Response(
            JSON.stringify({ error: 'Invalid signature' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    console.log('Received webhook:', JSON.stringify(payload, null, 2));

    const { meta, data } = payload;
    const eventName = meta?.event_name;

    if (!eventName) {
      throw new Error('Missing event_name in webhook payload');
    }

    // Extract customer email from meta custom data
    const customData = meta?.custom_data;
    const customerEmail = customData?.user_email;
    
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
    const variantId = data?.attributes?.variant_id?.toString();
    const customerId = data?.attributes?.customer_id?.toString();
    const attributes = data?.attributes;

    // Handle different webhook events
    switch (eventName) {
      case 'order_created':
        // Handle one-time purchase (Lifetime)
        const firstOrderItem = attributes?.first_order_item;
        const orderVariantId = firstOrderItem?.variant_id?.toString();
        
        if (orderVariantId === lifetimeVariantId) {
          console.log(`🌟 Upgrading user to lifetime: ${userId}`);
          
          await supabase
            .from('profiles')
            .update({
              subscription_tier: 'lifetime',
              is_premium: true,
              lemon_squeezy_customer_id: customerId,
              subscription_id: subscriptionId,
              subscription_status: 'active',
              subscription_ends_at: null, // Never expires
            })
            .eq('id', userId);
          
          console.log(`✅ Lifetime access granted for user: ${userId}`);
        }
        break;

      case 'subscription_created':
      case 'subscription_updated':
        // Handle recurring subscription (Premium Monthly)
        if (variantId === premiumVariantId) {
          const renewsAt = attributes?.renews_at;
          
          console.log(`💳 Updating Premium Monthly subscription for user: ${userId}`);
          
          await supabase
            .from('profiles')
            .update({
              subscription_tier: 'premium_monthly',
              subscription_id: subscriptionId,
              subscription_status: attributes?.status,
              is_premium: attributes?.status === 'active',
              subscription_ends_at: renewsAt,
              lemon_squeezy_customer_id: customerId,
              subscription_variant_id: variantId,
              subscription_product_id: attributes?.product_id?.toString(),
            })
            .eq('id', userId);
          
          console.log(`✅ Premium Monthly updated for user: ${userId}`);
        }
        break;

      case 'subscription_cancelled':
        // Don't immediately revoke access - wait for subscription_ends_at
        await supabase
          .from('profiles')
          .update({
            subscription_status: 'cancelled',
            // Keep is_premium true until subscription_ends_at
          })
          .eq('id', userId);
        
        console.log(`⚠️ Subscription cancelled for user: ${userId} (access until ${attributes?.renews_at})`);
        break;

      case 'subscription_expired':
        // Now actually revoke access
        await supabase
          .from('profiles')
          .update({
            subscription_status: 'expired',
            subscription_tier: 'free',
            is_premium: false,
          })
          .eq('id', userId);
        
        console.log(`❌ Subscription expired for user: ${userId}`);
        break;

      case 'subscription_payment_failed':
        await supabase
          .from('profiles')
          .update({
            subscription_status: 'past_due',
          })
          .eq('id', userId);
        
        console.log(`💳 Payment failed for user: ${userId}`);
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
