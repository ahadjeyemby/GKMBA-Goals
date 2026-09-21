-- Fixes a create-then-see-your-own-row RLS ordering bug: `groups` INSERT
-- policy allowed creating a group, but the SELECT policy required already
-- being a group_members row for it - which doesn't exist yet at creation
-- time. `.insert().select()` needs the SELECT policy to pass too (it's a
-- RETURNING clause under the hood), so group creation failed with
-- "new row violates row-level security policy for table groups" even
-- though the INSERT's own WITH CHECK was satisfied.
--
-- Fix: create the group, the creator's admin membership, and the initial
-- season atomically in one SECURITY DEFINER function, same pattern as
-- join_group_by_code. Also widen the groups SELECT policy as defense in
-- depth, in case anything ever selects a group outside this RPC.

drop policy if exists "members read their groups" on groups;
create policy "members read their groups" on groups for select
  using (is_group_member(id) or created_by = auth.uid());

create or replace function create_group_with_season(
  p_name text,
  p_invite_code text,
  p_start_date date,
  p_week_count int
) returns groups
language plpgsql
security definer
as $$
declare
  v_group groups;
  v_start date := p_start_date - (extract(isodow from p_start_date)::int - 1); -- snap to Monday
begin
  insert into groups (name, invite_code, created_by)
  values (p_name, p_invite_code, auth.uid())
  returning * into v_group;

  insert into group_members (group_id, user_id, role)
  values (v_group.id, auth.uid(), 'admin');

  insert into seasons (group_id, start_date, end_date, week_count)
  values (v_group.id, v_start, v_start + (p_week_count * 7 - 1), p_week_count);

  return v_group;
end;
$$;
