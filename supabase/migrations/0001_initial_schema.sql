-- AI Meeting Coordinator: initial shared data model
-- Apply through Supabase SQL editor or `supabase db push`.
-- OAuth access/refresh tokens deliberately do not belong in this schema.

create extension if not exists citext;

create type public.group_member_role as enum ('owner', 'admin', 'member');
create type public.calendar_sync_status as enum ('connected', 'syncing', 'needs_reauth', 'error', 'disconnected');
create type public.meeting_request_status as enum ('draft', 'parsed', 'ranked', 'confirmed', 'cancelled');
create type public.meeting_status as enum ('confirmed', 'held', 'cancelled');
create type public.rsvp_status as enum ('pending', 'accepted', 'declined', 'tentative');
create type public.attendance_status as enum ('unknown', 'attended', 'no_show', 'excused');
create type public.slot_availability as enum ('available', 'busy', 'unknown');
create type public.preferred_period as enum ('morning', 'afternoon', 'evening', 'any');
create type public.report_delivery_status as enum ('ready', 'read', 'failed');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email citext not null unique,
  display_name text not null default '',
  avatar_url text,
  timezone text not null default 'Asia/Seoul',
  weekly_report_opt_in boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  preferred_period public.preferred_period not null default 'any',
  workday_start time not null default '09:00',
  workday_end time not null default '18:00',
  max_meetings_per_day smallint not null default 4 check (max_meetings_per_day between 1 and 12),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (workday_start < workday_end)
);

create table public.calendar_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  provider text not null default 'google' check (provider = 'google'),
  provider_account_id text,
  granted_scopes text[] not null default '{}',
  calendar_ids jsonb not null default '[]'::jsonb,
  sync_status public.calendar_sync_status not null default 'disconnected',
  sync_cursor text,
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.calendar_busy_blocks (
  id uuid primary key default gen_random_uuid(),
  calendar_connection_id uuid not null references public.calendar_connections (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  source_event_id text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_all_day boolean not null default false,
  provider_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (calendar_connection_id, source_event_id),
  check (starts_at < ends_at)
);

create index calendar_busy_blocks_user_range_idx
  on public.calendar_busy_blocks (user_id, starts_at, ends_at);

create table public.team_groups (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles (id) on delete restrict,
  name text not null check (char_length(trim(name)) between 1 and 80),
  description text,
  default_meeting_importance smallint not null default 3 check (default_meeting_importance between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.team_groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.group_member_role not null default 'member',
  personal_importance smallint not null default 3 check (personal_importance between 1 and 5),
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index group_members_user_idx on public.group_members (user_id, group_id);

create table public.meeting_requests (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.team_groups (id) on delete cascade,
  requested_by uuid not null references public.profiles (id) on delete restrict,
  title text not null default '새 회의' check (char_length(trim(title)) between 1 and 120),
  raw_request text not null default '',
  ai_constraints jsonb not null default '{}'::jsonb,
  meeting_kind text not null default 'general',
  meeting_importance smallint not null default 3 check (meeting_importance between 1 and 5),
  duration_minutes smallint not null check (duration_minutes between 15 and 480),
  date_range_start date not null,
  date_range_end date not null,
  preferred_period public.preferred_period not null default 'any',
  status public.meeting_request_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (date_range_start <= date_range_end)
);

create index meeting_requests_group_status_idx
  on public.meeting_requests (group_id, status, created_at desc);

create table public.meeting_request_participants (
  request_id uuid not null references public.meeting_requests (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete restrict,
  is_required boolean not null default false,
  primary key (request_id, user_id)
);

create index meeting_request_participants_user_idx
  on public.meeting_request_participants (user_id, request_id);

create table public.schedule_candidates (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.meeting_requests (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  rank smallint not null check (rank between 1 and 3),
  score numeric(5,2) not null check (score between 0 and 100),
  score_breakdown jsonb not null default '{}'::jsonb,
  available_count smallint not null check (available_count >= 0),
  required_available_count smallint not null check (required_available_count >= 0),
  created_at timestamptz not null default now(),
  unique (request_id, rank),
  unique (request_id, starts_at),
  check (starts_at < ends_at)
);

create table public.candidate_availability (
  candidate_id uuid not null references public.schedule_candidates (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete restrict,
  availability public.slot_availability not null,
  reason_code text,
  primary key (candidate_id, user_id)
);

create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.team_groups (id) on delete cascade,
  source_request_id uuid unique references public.meeting_requests (id) on delete set null,
  created_by uuid not null references public.profiles (id) on delete restrict,
  title text not null check (char_length(trim(title)) between 1 and 120),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.meeting_status not null default 'confirmed',
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (starts_at < ends_at)
);

create index meetings_group_time_idx on public.meetings (group_id, starts_at desc);

create table public.meeting_participants (
  meeting_id uuid not null references public.meetings (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete restrict,
  is_required boolean not null default false,
  rsvp_status public.rsvp_status not null default 'pending',
  attendance_status public.attendance_status not null default 'unknown',
  attendance_note text,
  attendance_recorded_at timestamptz,
  primary key (meeting_id, user_id)
);

create index meeting_participants_user_idx on public.meeting_participants (user_id, meeting_id);

create table public.weekly_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  week_start date not null,
  delivery_channel text not null default 'web' check (delivery_channel in ('web', 'email')),
  delivery_status public.report_delivery_status not null default 'ready',
  content jsonb not null default '{}'::jsonb,
  ai_summary text,
  generated_at timestamptz not null default now(),
  read_at timestamptz,
  unique (user_id, week_start)
);

-- Supabase Auth owns auth.users. This trigger creates the app-facing profile and defaults.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
  set email = excluded.email,
      display_name = coalesce(nullif(excluded.display_name, ''), public.profiles.display_name),
      avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
      updated_at = now();

  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();
create trigger user_preferences_set_updated_at before update on public.user_preferences
  for each row execute procedure public.set_updated_at();
create trigger calendar_connections_set_updated_at before update on public.calendar_connections
  for each row execute procedure public.set_updated_at();
create trigger calendar_busy_blocks_set_updated_at before update on public.calendar_busy_blocks
  for each row execute procedure public.set_updated_at();
create trigger team_groups_set_updated_at before update on public.team_groups
  for each row execute procedure public.set_updated_at();
create trigger group_members_set_updated_at before update on public.group_members
  for each row execute procedure public.set_updated_at();
create trigger meeting_requests_set_updated_at before update on public.meeting_requests
  for each row execute procedure public.set_updated_at();
create trigger meetings_set_updated_at before update on public.meetings
  for each row execute procedure public.set_updated_at();

-- A creator is automatically the owner member of the new group.
create or replace function public.add_group_owner()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.group_members (group_id, user_id, role, personal_importance)
  values (new.id, new.owner_user_id, 'owner', 5)
  on conflict (group_id, user_id) do update set role = 'owner';
  return new;
end;
$$;

create trigger team_groups_add_owner
  after insert on public.team_groups
  for each row execute procedure public.add_group_owner();

-- Helpers use SECURITY DEFINER to avoid RLS recursion in membership checks.
create or replace function public.is_group_member(target_group_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.group_members
    where group_id = target_group_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_group_owner(target_group_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.group_members
    where group_id = target_group_id and user_id = auth.uid() and role in ('owner', 'admin')
  );
$$;

create or replace function public.shares_group_with(target_user_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1
    from public.group_members mine
    join public.group_members theirs on theirs.group_id = mine.group_id
    where mine.user_id = auth.uid() and theirs.user_id = target_user_id
  );
$$;

-- Use this RPC for the member-editable importance field; role management stays owner-only.
create or replace function public.set_personal_group_importance(target_group_id uuid, target_importance smallint)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if target_importance not between 1 and 5 then
    raise exception 'personal importance must be between 1 and 5';
  end if;

  update public.group_members
  set personal_importance = target_importance
  where group_id = target_group_id and user_id = auth.uid();

  if not found then
    raise exception 'group membership not found';
  end if;
end;
$$;

revoke all on function public.is_group_member(uuid) from public;
revoke all on function public.is_group_owner(uuid) from public;
revoke all on function public.shares_group_with(uuid) from public;
grant execute on function public.is_group_member(uuid), public.is_group_owner(uuid), public.shares_group_with(uuid) to authenticated;
grant execute on function public.set_personal_group_importance(uuid, smallint) to authenticated;

-- Attendance rate is a derived metric. Only held meetings contribute to its denominator.
create or replace view public.user_group_attendance_summary
with (security_invoker = true)
as
select
  m.group_id,
  mp.user_id,
  count(*) filter (where m.status = 'held') as held_meetings,
  count(*) filter (where m.status = 'held' and mp.attendance_status = 'attended') as attended_meetings,
  round(
    count(*) filter (where m.status = 'held' and mp.attendance_status = 'attended')::numeric
    / nullif(count(*) filter (where m.status = 'held'), 0),
    3
  ) as attendance_rate
from public.meeting_participants mp
join public.meetings m on m.id = mp.meeting_id
group by m.group_id, mp.user_id;

-- RLS: users see their own integration data; groups see shared coordination data.
alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.calendar_connections enable row level security;
alter table public.calendar_busy_blocks enable row level security;
alter table public.team_groups enable row level security;
alter table public.group_members enable row level security;
alter table public.meeting_requests enable row level security;
alter table public.meeting_request_participants enable row level security;
alter table public.schedule_candidates enable row level security;
alter table public.candidate_availability enable row level security;
alter table public.meetings enable row level security;
alter table public.meeting_participants enable row level security;
alter table public.weekly_reports enable row level security;

create policy profiles_read_self_or_group on public.profiles for select to authenticated
  using (id = auth.uid() or public.shares_group_with(id));
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy preferences_own on public.user_preferences for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy calendar_connections_own on public.calendar_connections for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy calendar_busy_blocks_own on public.calendar_busy_blocks for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy groups_read_member on public.team_groups for select to authenticated
  using (public.is_group_member(id));
create policy groups_create_self_owner on public.team_groups for insert to authenticated
  with check (owner_user_id = auth.uid());
create policy groups_manage_owner on public.team_groups for update to authenticated
  using (public.is_group_owner(id)) with check (public.is_group_owner(id));

create policy group_members_read_member on public.group_members for select to authenticated
  using (public.is_group_member(group_id));
create policy group_members_add_owner on public.group_members for insert to authenticated
  with check (public.is_group_owner(group_id));
create policy group_members_manage_owner on public.group_members for update to authenticated
  using (public.is_group_owner(group_id)) with check (public.is_group_owner(group_id));
create policy group_members_remove_self_or_owner on public.group_members for delete to authenticated
  using (user_id = auth.uid() or public.is_group_owner(group_id));

create policy requests_read_member on public.meeting_requests for select to authenticated
  using (public.is_group_member(group_id));
create policy requests_create_member on public.meeting_requests for insert to authenticated
  with check (public.is_group_member(group_id) and requested_by = auth.uid());
create policy requests_update_creator_or_owner on public.meeting_requests for update to authenticated
  using (requested_by = auth.uid() or public.is_group_owner(group_id))
  with check (public.is_group_member(group_id));

create policy request_participants_read_member on public.meeting_request_participants for select to authenticated
  using (exists (select 1 from public.meeting_requests r where r.id = request_id and public.is_group_member(r.group_id)));

create policy candidates_read_member on public.schedule_candidates for select to authenticated
  using (exists (select 1 from public.meeting_requests r where r.id = request_id and public.is_group_member(r.group_id)));
create policy candidate_availability_read_member on public.candidate_availability for select to authenticated
  using (exists (
    select 1 from public.schedule_candidates c
    join public.meeting_requests r on r.id = c.request_id
    where c.id = candidate_id and public.is_group_member(r.group_id)
  ));

create policy meetings_read_member on public.meetings for select to authenticated
  using (public.is_group_member(group_id));
create policy meeting_participants_read_member on public.meeting_participants for select to authenticated
  using (exists (select 1 from public.meetings m where m.id = meeting_id and public.is_group_member(m.group_id)));

create policy weekly_reports_own on public.weekly_reports for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Server-side API routes using the service role perform calendar sync, candidate writes,
-- meeting confirmation, attendance updates, and weekly report generation.
