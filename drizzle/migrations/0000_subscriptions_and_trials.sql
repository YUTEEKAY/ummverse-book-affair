create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  paddle_subscription_id text not null unique,
  paddle_customer_id text not null,
  product_id text not null,
  price_id text not null,
  status text not null default 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  environment text not null default 'sandbox',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_subscriptions_user_id on public.subscriptions(user_id);
grant select on public.subscriptions to authenticated;
grant all on public.subscriptions to service_role;
alter table public.subscriptions enable row level security;
create policy "Users can view own subscription" on public.subscriptions for select to authenticated using (auth.uid() = user_id);

create table public.feature_usage (
  user_id uuid primary key,
  uses integer not null default 0,
  updated_at timestamptz not null default now()
);
grant select on public.feature_usage to authenticated;
grant all on public.feature_usage to service_role;
alter table public.feature_usage enable row level security;
create policy "Users can view own usage" on public.feature_usage for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_active_subscription(user_uuid uuid, check_env text default 'live')
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.subscriptions
    where user_id = user_uuid and environment = check_env
    and (
      (status in ('active','trialing','past_due') and (current_period_end is null or current_period_end > now()))
      or (status = 'canceled' and current_period_end > now())
    )
  );
$$;

-- Consume one free try. Device count carries over (max of stored and device count).
create or replace function public.consume_trial(device_uses integer, check_env text default 'live')
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  current_uses integer;
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;
  if public.has_active_subscription(uid, check_env) then
    return jsonb_build_object('allowed', true, 'subscribed', true, 'uses', 0);
  end if;
  insert into public.feature_usage(user_id, uses) values (uid, 0) on conflict (user_id) do nothing;
  select uses into current_uses from public.feature_usage where user_id = uid for update;
  current_uses := greatest(current_uses, least(greatest(coalesce(device_uses,0),0), 2));
  if current_uses >= 2 then
    update public.feature_usage set uses = current_uses, updated_at = now() where user_id = uid;
    return jsonb_build_object('allowed', false, 'subscribed', false, 'uses', current_uses);
  end if;
  current_uses := current_uses + 1;
  update public.feature_usage set uses = current_uses, updated_at = now() where user_id = uid;
  return jsonb_build_object('allowed', true, 'subscribed', false, 'uses', current_uses);
end;
$$;
revoke execute on function public.consume_trial(integer, text) from public, anon;
grant execute on function public.consume_trial(integer, text) to authenticated;