GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, UPDATE ON public.subscriptions TO authenticated;
GRANT SELECT, UPDATE ON public.feature_usage TO authenticated;

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all subscriptions" ON public.subscriptions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all usage" ON public.feature_usage FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all usage" ON public.feature_usage FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

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
    WHERE s2.user_id = u.id AND s2.environment = check_env
    ORDER BY s2.created_at DESC LIMIT 1
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
  -- end any existing manual grant
  UPDATE public.subscriptions SET status = 'canceled', current_period_end = now(), updated_at = now()
  WHERE user_id = target_user AND environment = check_env AND paddle_subscription_id LIKE 'manual_%'
    AND status IN ('active', 'trialing');
  IF tier = 'free' THEN RETURN; END IF;
  INSERT INTO public.subscriptions (user_id, paddle_subscription_id, paddle_customer_id, product_id, price_id,
    status, current_period_start, current_period_end, environment)
  VALUES (target_user, 'manual_' || gen_random_uuid(), 'manual', 'ummverse_premium',
    CASE WHEN tier = 'annual' THEN 'premium_yearly' ELSE 'premium_monthly' END,
    'active', now(), now() + CASE WHEN tier = 'annual' THEN interval '1 year' ELSE interval '1 month' END,
    check_env);
END $$;

CREATE OR REPLACE FUNCTION public.admin_reset_trials(target_user uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;
  UPDATE public.feature_usage SET uses = 0, updated_at = now() WHERE user_id = target_user;
END $$;

REVOKE ALL ON FUNCTION public.admin_list_users(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_tier(uuid, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_reset_trials(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_tier(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reset_trials(uuid) TO authenticated;