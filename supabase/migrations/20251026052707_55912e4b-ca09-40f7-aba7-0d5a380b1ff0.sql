-- Grant lifetime access to test user ummatanko@gmail.com
UPDATE public.profiles
SET 
  subscription_tier = 'lifetime',
  subscription_status = 'active',
  is_premium = true,
  subscription_ends_at = NULL,
  lemon_squeezy_customer_id = 'test_customer_lifetime',
  updated_at = now()
WHERE email = 'ummatanko@gmail.com';