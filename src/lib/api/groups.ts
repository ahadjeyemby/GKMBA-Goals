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

export async function createGroup(name: string, userId: string): Promise<Group> {
  const invite_code = randomInviteCode();
  const { data: group, error } = await supabase
    .from('groups')
    .insert({ name, invite_code, created_by: userId })
    .select()
    .single();
  if (error) throw error;

  const { error: memberError } = await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: userId, role: 'admin' });
  if (memberError) throw memberError;

  return group;
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
