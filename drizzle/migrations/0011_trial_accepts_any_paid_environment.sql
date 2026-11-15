CREATE OR REPLACE FUNCTION public.consume_trial(device_uses integer, check_env text DEFAULT 'live'::text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare
  uid uuid := auth.uid();
  current_uses integer;
begin
  if uid is null then raise exception 'Not signed in'; end if;
  if public.is_paid_member(uid) then
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
$function$;