-- Create subscription tier enum
CREATE TYPE public.subscription_tier AS ENUM ('free', 'premium_monthly', 'lifetime');

-- Add subscription tier and Lemon Squeezy fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN subscription_tier subscription_tier NOT NULL DEFAULT 'free',
ADD COLUMN lemon_squeezy_customer_id TEXT,
ADD COLUMN subscription_variant_id TEXT,
ADD COLUMN subscription_product_id TEXT,
ADD COLUMN subscription_ends_at TIMESTAMPTZ;

-- Add indexes for faster queries
CREATE INDEX idx_profiles_subscription_tier ON public.profiles(subscription_tier);
CREATE INDEX idx_profiles_lemon_squeezy_customer_id ON public.profiles(lemon_squeezy_customer_id);

-- Create helper function to update is_premium based on subscription_tier
CREATE OR REPLACE FUNCTION public.update_premium_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically set is_premium based on subscription_tier
  NEW.is_premium := (NEW.subscription_tier IN ('premium_monthly', 'lifetime'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic premium status updates
CREATE TRIGGER set_premium_status
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_premium_status();