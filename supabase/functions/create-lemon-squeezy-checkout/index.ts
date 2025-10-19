import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const lemonSqueezyApiKey = Deno.env.get("LEMON_SQUEEZY_API_KEY")!;
    const storeId = Deno.env.get("LEMON_SQUEEZY_STORE_ID")!;
    const premiumVariantId = Deno.env.get("LEMON_SQUEEZY_PREMIUM_VARIANT_ID")!;
    const lifetimeVariantId = Deno.env.get("LEMON_SQUEEZY_LIFETIME_VARIANT_ID")!;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: req.headers.get("Authorization")! },
      },
    });

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Authentication error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Creating checkout for user:", user.id);

    const { tier } = await req.json();

    if (!tier || !["monthly", "lifetime"].includes(tier)) {
      return new Response(
        JSON.stringify({ error: "Invalid tier specified" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const variantId = tier === "monthly" ? premiumVariantId : lifetimeVariantId;
    const origin = req.headers.get("origin") || "https://ummverse.lovable.app";

    console.log("Creating checkout for tier:", tier, "variant:", variantId);

    // Create checkout session via Lemon Squeezy API
    const checkoutData = {
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email: user.email,
            custom: {
              user_email: user.email,
            },
          },
          product_options: {
            redirect_url: `${origin}/premium?success=true`,
            receipt_link_url: `${origin}/premium`,
            receipt_thank_you_note: "Thank you for supporting Ummverse!",
          },
        },
        relationships: {
          store: {
            data: {
              type: "stores",
              id: storeId,
            },
          },
          variant: {
            data: {
              type: "variants",
              id: variantId,
            },
          },
        },
      },
    };

    console.log("Sending request to Lemon Squeezy...");

    const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lemonSqueezyApiKey}`,
        "Content-Type": "application/vnd.api+json",
        Accept: "application/vnd.api+json",
      },
      body: JSON.stringify(checkoutData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lemon Squeezy API error:", response.status, errorText);
      return new Response(
        JSON.stringify({
          error: "Failed to create checkout",
          details: errorText,
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const checkout = await response.json();
    console.log("Checkout created successfully:", checkout.data.id);

    return new Response(
      JSON.stringify({ url: checkout.data.attributes.url }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating checkout:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
