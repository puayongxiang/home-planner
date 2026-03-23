create or replace function public.hook_allow_only_editor_emails(event jsonb)
returns jsonb
language plpgsql
as $$
declare
  signup_email text;
begin
  signup_email := lower(coalesce(event->'user'->>'email', ''));

  if signup_email = any (array[
    'puayongxiang@gmail.com',
    'evonne89@gmail.com'
  ]) then
    return '{}'::jsonb;
  end if;

  return jsonb_build_object(
    'error',
    jsonb_build_object(
      'http_code', 403,
      'message', 'This account is not allowed to sign in.'
    )
  );
end;
$$;

grant execute
  on function public.hook_allow_only_editor_emails
  to supabase_auth_admin;

revoke execute
  on function public.hook_allow_only_editor_emails
  from authenticated, anon, public;
