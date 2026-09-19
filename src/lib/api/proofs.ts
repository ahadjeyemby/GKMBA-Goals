import { supabase } from '@/lib/supabase';
import type { Proof, ProofType } from '@/types/database';

export async function getProofs(weeklyGoalId: string): Promise<Proof[]> {
  const { data, error } = await supabase
    .from('proofs')
    .select()
    .eq('weekly_goal_id', weeklyGoalId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addTextOrLinkProof(
  weeklyGoalId: string,
  type: Extract<ProofType, 'text' | 'link'>,
  content: string,
): Promise<Proof> {
  const { data, error } = await supabase
    .from('proofs')
    .insert({ weekly_goal_id: weeklyGoalId, type, content })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Uploads a local photo/video file (from expo-image-picker) to the `proofs`
 * bucket under <group_id>/<user_id>/<random>.<ext>, then records the proof row.
 */
export async function addMediaProof(params: {
  groupId: string;
  userId: string;
  weeklyGoalId: string;
  type: Extract<ProofType, 'photo' | 'video'>;
  localUri: string;
  fileExt: string;
}): Promise<Proof> {
  const { groupId, userId, weeklyGoalId, type, localUri, fileExt } = params;
  const path = `${groupId}/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

  const response = await fetch(localUri);
  const blob = await response.blob();

  const { error: uploadError } = await supabase.storage.from('proofs').upload(path, blob, {
    contentType: type === 'photo' ? `image/${fileExt}` : `video/${fileExt}`,
  });
  if (uploadError) throw uploadError;

  const { data: publicUrl } = supabase.storage.from('proofs').getPublicUrl(path);

  const { data, error } = await supabase
    .from('proofs')
    .insert({ weekly_goal_id: weeklyGoalId, type, content: publicUrl.publicUrl })
    .select()
    .single();
  if (error) throw error;
  return data;
}
