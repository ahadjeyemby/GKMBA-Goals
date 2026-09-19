import { supabase } from '@/lib/supabase';
import type { Comment, CommentTargetType } from '@/types/database';

export async function getComments(targetType: CommentTargetType, targetId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select()
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addComment(
  targetType: CommentTargetType,
  targetId: string,
  authorId: string,
  body: string,
): Promise<Comment> {
  const { data, error } = await supabase
    .from('comments')
    .insert({ target_type: targetType, target_id: targetId, author_id: authorId, body })
    .select()
    .single();
  if (error) throw error;
  return data;
}
