import { supabase } from '@/lib/supabase';
import type { Group, GroupMember, Profile } from '@/types/database';

function randomInviteCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

/**
 * Creates the group, the creator's admin membership, and the initial
 * season atomically via a SECURITY DEFINER RPC. Doing this as three
 * separate client-side inserts hits an RLS ordering trap: `.insert().select()`
 * needs the SELECT policy to pass too (it's a RETURNING clause), and the
 * creator isn't a group_members row yet at the moment the group itself is
 * inserted - see supabase/migrations/0003_fix_group_create.sql.
 */
export async function createGroup(
  name: string,
  startDate: Date,
  weekCount: number,
): Promise<Group> {
  const invite_code = randomInviteCode();
  const { data, error } = await supabase.rpc('create_group_with_season', {
    p_name: name,
    p_invite_code: invite_code,
    p_start_date: startDate.toISOString().slice(0, 10),
    p_week_count: weekCount,
  });
  if (error) throw error;
  return data as Group;
}

export async function joinGroupByCode(inviteCode: string): Promise<string> {
  const { data, error } = await supabase.rpc('join_group_by_code', {
    p_invite_code: inviteCode.trim().toUpperCase(),
  });
  if (error) throw error;
  return data as string;
}

export async function getMyGroups(userId: string): Promise<Group[]> {
  const { data, error } = await supabase
    .from('group_members')
    .select('groups(*)')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).flatMap((row) => (row.groups ? [row.groups as unknown as Group] : []));
}

export interface RosterEntry {
  member: GroupMember;
  profile: Profile;
}

export async function getGroupRoster(groupId: string): Promise<RosterEntry[]> {
  const { data, error } = await supabase
    .from('group_members')
    .select('*, profiles(*)')
    .eq('group_id', groupId);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    member: row as unknown as GroupMember,
    profile: (row as unknown as { profiles: Profile }).profiles,
  }));
}
