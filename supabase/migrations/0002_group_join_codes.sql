-- Secure group join codes: five uppercase letters followed by five digits.
-- The plaintext code is returned once on creation and never stored.

create extension if not exists pgcrypto;

create table public.group_join_codes (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.team_groups (id) on delete cascade,
  code_hash text not null unique,
  created_by uuid not null references public.profiles (id) on delete restrict,
  expires_at timestamptz,
  max_uses integer check (max_uses is null or max_uses > 0),
  use_count integer not null default 0 check (use_count >= 0),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (expires_at is null or expires_at > created_at),
  check (max_uses is null or use_count <= max_uses)
);

create index group_join_codes_group_active_idx
  on public.group_join_codes (group_id, created_at desc)
  where revoked_at is null;

alter table public.group_join_codes enable row level security;

-- Owners create codes through this RPC. It generates the code server-side and
-- returns the plaintext exactly once; only a SHA-256 hash remains in the table.
create or replace function public.create_group_join_code(
  target_group_id uuid,
  valid_for interval default interval '7 days',
  allowed_uses integer default 20
)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  letters constant text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  digits constant text := '0123456789';
  generated_code text;
  random_bytes bytea;
  attempt integer;
begin
  if not public.is_group_owner(target_group_id) then
    raise exception 'only a group owner or admin can create a join code';
  end if;

  if valid_for is null or valid_for <= interval '0 seconds' then
    raise exception 'valid_for must be positive';
  end if;

  if allowed_uses is not null and allowed_uses <= 0 then
    raise exception 'allowed_uses must be positive';
  end if;

  for attempt in 1..10 loop
    random_bytes := gen_random_bytes(10);
    generated_code := '';

    for character_index in 1..5 loop
      generated_code := generated_code || substr(letters, 1 + (get_byte(random_bytes, character_index - 1) % length(letters)), 1);
    end loop;

    for character_index in 6..10 loop
      generated_code := generated_code || substr(digits, 1 + (get_byte(random_bytes, character_index - 1) % length(digits)), 1);
    end loop;

    begin
      insert into public.group_join_codes (
        group_id,
        code_hash,
        created_by,
        expires_at,
        max_uses
      )
      values (
        target_group_id,
        encode(digest(generated_code, 'sha256'), 'hex'),
        auth.uid(),
        now() + valid_for,
        allowed_uses
      );

      return generated_code;
    exception when unique_violation then
      -- Extremely unlikely, but retry without exposing another group's code.
    end;
  end loop;

  raise exception 'could not generate a unique join code';
end;
$$;

-- A signed-in user redeems a valid code and becomes a member immediately.
-- The unique group_members primary key makes repeated redemption idempotent.
create or replace function public.join_group_with_code(submitted_code text)
returns table (group_id uuid, group_name text, already_member boolean)
language plpgsql
security definer set search_path = public
as $$
declare
  normalized_code text := upper(regexp_replace(coalesce(submitted_code, ''), '[^A-Za-z0-9]', '', 'g'));
  matched_code public.group_join_codes%rowtype;
  was_member boolean;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  if normalized_code !~ '^[A-Z]{5}[0-9]{5}$' then
    raise exception 'invalid join code format';
  end if;

  select *
  into matched_code
  from public.group_join_codes
  where code_hash = encode(digest(normalized_code, 'sha256'), 'hex')
    and revoked_at is null
    and (expires_at is null or expires_at > now())
  for update;

  if not found then
    raise exception 'invalid or expired join code';
  end if;

  select exists (
    select 1 from public.group_members member
    where member.group_id = matched_code.group_id
      and member.user_id = auth.uid()
  ) into was_member;

  if not was_member and matched_code.max_uses is not null and matched_code.use_count >= matched_code.max_uses then
    raise exception 'join code usage limit reached';
  end if;

  insert into public.group_members (group_id, user_id, role, personal_importance)
  values (matched_code.group_id, auth.uid(), 'member', 3)
  on conflict (group_id, user_id) do nothing;

  if not was_member then
    update public.group_join_codes
    set use_count = use_count + 1
    where id = matched_code.id;
  end if;

  return query
    select matched_code.group_id, target_group.name, was_member
    from public.team_groups target_group
    where target_group.id = matched_code.group_id;
end;
$$;

revoke all on function public.create_group_join_code(uuid, interval, integer) from public;
revoke all on function public.join_group_with_code(text) from public;
grant execute on function public.create_group_join_code(uuid, interval, integer) to authenticated;
grant execute on function public.join_group_with_code(text) to authenticated;
