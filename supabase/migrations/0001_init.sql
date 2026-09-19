-- The Ledger — initial schema
-- Mirrors the plan in /root/.claude/plans (see README for the product plan).
-- Fixed Monday-Sunday weekly cadence; multi-tenant (many groups/seasons).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type plan_tier as enum ('free', 'paid');
create type group_role as enum ('admin', 'member');
create type proof_type as enum ('text', 'link', 'photo', 'video');
create type comment_target_type as enum ('weekly_goal', 'hundred_day_goal');
create type ai_mode as enum ('platform_agent', 'byo_api_key', 'byo_endpoint');
create type ai_provider as enum ('anthropic', 'openai', 'gemini', 'custom');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  signature_color text not null default '#D21F3C',
  avatar_url text,
  plan_tier plan_tier not null default 'free',
  created_at timestamptz not null default now()
);

create table groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_by uuid not null references profiles (id) on delete restrict,
  plan_tier plan_tier not null default 'free',
  created_at timestamptz not null default now()
);

create table group_members (
  group_id uuid not null references groups (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  role group_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table seasons (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups (id) on delete cascade,
  start_date date not null, -- must be a Monday, enforced below
  end_date date not null,
  week_count int not null check (week_count > 0),
  created_at timestamptz not null default now(),
  constraint start_date_is_monday check (extract(isodow from start_date) = 1)
);

create table hundred_day_goals (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  goal_number smallint not null check (goal_number between 1 and 3),
  text text not null,
  reward_text text,
  created_at timestamptz not null default now(),
  unique (season_id, user_id, goal_number)
);

create table hundred_day_progress (
  hundred_day_goal_id uuid not null references hundred_day_goals (id) on delete cascade,
  week_number int not null check (week_number > 0),
  completed boolean not null default false,
  primary key (hundred_day_goal_id, week_number)
);

create table weeks (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons (id) on delete cascade,
  week_number int not null check (week_number > 0),
  week_start_date date not null,
  created_at timestamptz not null default now(),
  unique (season_id, week_number)
);

create table weekly_goals (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references weeks (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  goal_number smallint not null check (goal_number between 1 and 3),
  text text not null,
  created_at timestamptz not null default now(),
  unique (week_id, user_id, goal_number)
);

create table daily_checkins (
  id uuid primary key default gen_random_uuid(),
  weekly_goal_id uuid not null references weekly_goals (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6), -- 0=Mon .. 6=Sun
  completed boolean not null default false,
  completed_at timestamptz,
  unique (weekly_goal_id, day_of_week)
);

create table proofs (
  id uuid primary key default gen_random_uuid(),
  weekly_goal_id uuid not null references weekly_goals (id) on delete cascade,
  type proof_type not null,
  content text not null, -- URL (link/photo/video, via Supabase Storage) or free text
  created_at timestamptz not null default now()
);

create table comments (
  id uuid primary key default gen_random_uuid(),
  target_type comment_target_type not null,
  target_id uuid not null, -- weekly_goals.id or hundred_day_goals.id, validated by trigger below
  author_id uuid not null references profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table ai_settings (
  user_id uuid primary key references profiles (id) on delete cascade,
  mode ai_mode not null default 'platform_agent',
  provider ai_provider,
  encrypted_api_key text,
  custom_endpoint_url text,
  enabled_features jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table notification_prefs (
  user_id uuid primary key references profiles (id) on delete cascade,
  push_enabled boolean not null default true,
  email_enabled boolean not null default true,
  quiet_hours_start time,
  quiet_hours_end time
);

-- ---------------------------------------------------------------------------
-- Helper functions (used by RLS policies)
-- ---------------------------------------------------------------------------

create or replace function is_group_member(p_group_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from group_members
    where group_id = p_group_id and user_id = auth.uid()
  );
$$;

create or replace function group_id_for_season(p_season_id uuid)
returns uuid
language sql
security definer
stable
as $$
  select group_id from seasons where id = p_season_id;
$$;

create or replace function group_id_for_week(p_week_id uuid)
returns uuid
language sql
security definer
stable
as $$
  select group_id_for_season(season_id) from weeks where id = p_week_id;
$$;

create or replace function group_id_for_weekly_goal(p_weekly_goal_id uuid)
returns uuid
language sql
security definer
stable
as $$
  select group_id_for_week(week_id) from weekly_goals where id = p_weekly_goal_id;
$$;

create or replace function owner_of_comment_target(p_target_type comment_target_type, p_target_id uuid)
returns uuid
language sql
security definer
stable
as $$
  select case p_target_type
    when 'weekly_goal' then (select user_id from weekly_goals where id = p_target_id)
    when 'hundred_day_goal' then (select user_id from hundred_day_goals where id = p_target_id)
  end;
$$;

-- Join a group by invite code without exposing every group's code via SELECT.
create or replace function join_group_by_code(p_invite_code text)
returns uuid
language plpgsql
security definer
as $$
declare
  v_group_id uuid;
begin
  select id into v_group_id from groups where invite_code = p_invite_code;
  if v_group_id is null then
    raise exception 'Invalid invite code';
  end if;

  insert into group_members (group_id, user_id)
  values (v_group_id, auth.uid())
  on conflict do nothing;

  return v_group_id;
end;
$$;

-- Comments are for others, not yourself.
create or replace function enforce_comment_not_self()
returns trigger
language plpgsql
as $$
begin
  if owner_of_comment_target(new.target_type, new.target_id) = new.author_id then
    raise exception 'Cannot comment on your own goal';
  end if;
  return new;
end;
$$;

create trigger trg_comment_not_self
  before insert or update on comments
  for each row execute function enforce_comment_not_self();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table profiles enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table seasons enable row level security;
alter table hundred_day_goals enable row level security;
alter table hundred_day_progress enable row level security;
alter table weeks enable row level security;
alter table weekly_goals enable row level security;
alter table daily_checkins enable row level security;
alter table proofs enable row level security;
alter table comments enable row level security;
alter table ai_settings enable row level security;
alter table notification_prefs enable row level security;

-- profiles: readable by anyone sharing a group; writable only by the owner.
create policy "profiles are readable by group-mates" on profiles for select
  using (
    id = auth.uid()
    or exists (
      select 1 from group_members gm1
      join group_members gm2 on gm1.group_id = gm2.group_id
      where gm1.user_id = profiles.id and gm2.user_id = auth.uid()
    )
  );
create policy "users manage their own profile" on profiles for insert with check (id = auth.uid());
create policy "users update their own profile" on profiles for update using (id = auth.uid());

-- groups: members can read; invite_code is never selected directly for
-- joining (use join_group_by_code). Creation is open to any authed user.
create policy "members read their groups" on groups for select using (is_group_member(id));
create policy "authed users create groups" on groups for insert with check (created_by = auth.uid());
create policy "admins update their group" on groups for update
  using (exists (select 1 from group_members where group_id = id and user_id = auth.uid() and role = 'admin'));

-- group_members: readable by fellow members; self-insert on group creation,
-- everything else goes through join_group_by_code (security definer).
create policy "members read group roster" on group_members for select using (is_group_member(group_id));
create policy "creator joins own group as admin" on group_members for insert
  with check (user_id = auth.uid());

-- seasons / weeks / goals / checkins / proofs: scoped to group membership.
create policy "members read seasons" on seasons for select using (is_group_member(group_id));
create policy "admins create seasons" on seasons for insert
  with check (exists (select 1 from group_members where group_id = seasons.group_id and user_id = auth.uid() and role = 'admin'));

create policy "members read weeks" on weeks for select using (is_group_member(group_id_for_season(season_id)));
create policy "members create weeks" on weeks for insert
  with check (is_group_member(group_id_for_season(season_id)));

create policy "members read hundred day goals" on hundred_day_goals for select
  using (is_group_member(group_id_for_season(season_id)));
create policy "users manage their own hundred day goals" on hundred_day_goals for insert
  with check (user_id = auth.uid() and is_group_member(group_id_for_season(season_id)));
create policy "users update their own hundred day goals" on hundred_day_goals for update
  using (user_id = auth.uid());

create policy "members read hundred day progress" on hundred_day_progress for select
  using (is_group_member(group_id_for_season((select season_id from hundred_day_goals where id = hundred_day_goal_id))));
create policy "users tick their own hundred day progress" on hundred_day_progress for all
  using (auth.uid() = (select user_id from hundred_day_goals where id = hundred_day_goal_id))
  with check (auth.uid() = (select user_id from hundred_day_goals where id = hundred_day_goal_id));

create policy "members read weekly goals" on weekly_goals for select
  using (is_group_member(group_id_for_week(week_id)));
create policy "users manage their own weekly goals" on weekly_goals for insert
  with check (user_id = auth.uid() and is_group_member(group_id_for_week(week_id)));
create policy "users update their own weekly goals" on weekly_goals for update
  using (user_id = auth.uid());

create policy "members read checkins" on daily_checkins for select
  using (is_group_member(group_id_for_weekly_goal(weekly_goal_id)));
create policy "users tick their own checkins" on daily_checkins for all
  using (auth.uid() = (select user_id from weekly_goals where id = weekly_goal_id))
  with check (auth.uid() = (select user_id from weekly_goals where id = weekly_goal_id));

create policy "members read proofs" on proofs for select
  using (is_group_member(group_id_for_weekly_goal(weekly_goal_id)));
create policy "users add their own proof" on proofs for insert
  with check (auth.uid() = (select user_id from weekly_goals where id = weekly_goal_id));

-- comments: readable by group-mates, insertable by group-mates (self-comment
-- blocked by trg_comment_not_self above).
create policy "members read comments" on comments for select
  using (
    case target_type
      when 'weekly_goal' then is_group_member(group_id_for_weekly_goal(target_id))
      when 'hundred_day_goal' then is_group_member(group_id_for_season((select season_id from hundred_day_goals where id = target_id)))
    end
  );
create policy "members add comments" on comments for insert
  with check (
    author_id = auth.uid()
    and case target_type
      when 'weekly_goal' then is_group_member(group_id_for_weekly_goal(target_id))
      when 'hundred_day_goal' then is_group_member(group_id_for_season((select season_id from hundred_day_goals where id = target_id)))
    end
  );

-- ai_settings / notification_prefs: strictly private to the owning user.
create policy "users manage their own ai settings" on ai_settings for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users manage their own notification prefs" on notification_prefs for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
