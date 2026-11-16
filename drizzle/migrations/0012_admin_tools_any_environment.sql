CREATE OR REPLACE FUNCTION public.admin_list_users(check_env text DEFAULT 'live')
RETURNS TABLE (
  id uuid, email text, full_name text, created_at timestamptz, trials_used integer,
  price_id text, status text, current_period_end timestamptz, cancel_at_period_end boolean, is_manual boolean
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT u.id, u.email::text,
    COALESCE(p.full_name, u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name')::text,
    u.created_at,
    LEAST(COALESCE(f.uses, 0), 2),
    s.price_id, s.status, s.current_period_end, s.cancel_at_period_end,
    COALESCE(s.paddle_subscription_id LIKE 'manual_%', false)
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  LEFT JOIN public.feature_usage f ON f.user_id = u.id
  LEFT JOIN LATERAL (
    SELECT * FROM public.subscriptions s2
    WHERE s2.user_id = u.id AND s2.environment IN ('live', 'sandbox')
    ORDER BY (s2.status IN ('active','trialing') AND (s2.current_period_end IS NULL OR s2.current_period_end > now())) DESC,
             s2.created_at DESC
    LIMIT 1
  ) s ON true
  WHERE NOT public.has_role(u.id, 'admin')
  ORDER BY u.created_at DESC;
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_tier(target_user uuid, tier text, check_env text DEFAULT 'live')
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;
  IF tier NOT IN ('free', 'monthly', 'annual') THEN
    RAISE EXCEPTION 'Invalid tier';
  END IF;
  IF check_env NOT IN ('live', 'sandbox') THEN
    RAISE EXCEPTION 'Invalid environment';
  END IF;
  UPDATE public.subscriptions SET status = 'canceled', current_period_end = now(), updated_at = now()
  WHERE user_id = target_user AND environment IN ('live', 'sandbox') AND paddle_subscription_id LIKE 'manual_%'
    AND status IN ('active', 'trialing');
  IF tier = 'free' THEN RETURN; END IF;
  INSERT INTO public.subscriptions (user_id, paddle_subscription_id, paddle_customer_id, product_id, price_id,
    status, current_period_start, current_period_end, environment)
  VALUES (target_user, 'manual_' || gen_random_uuid(), 'manual', 'ummverse_premium',
    CASE WHEN tier = 'annual' THEN 'premium_yearly' ELSE 'premium_monthly' END,
    'active', now(), now() + CASE WHEN tier = 'annual' THEN interval '1 year' ELSE interval '1 month' END,
    check_env);
END $$;