import { supabase } from '@/lib/supabase';
import type { NotificationPrefs, Profile } from '@/types/database';

export async function updateSignatureColor(userId: string, color: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ signature_color: color })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getNotificationPrefs(userId: string): Promise<NotificationPrefs> {
  const { data, error } = await supabase
    .from('notification_prefs')
    .select()
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return (
    data ?? {
      user_id: userId,
      push_enabled: true,
      email_enabled: true,
      quiet_hours_start: null,
      quiet_hours_end: null,
    }
  );
}

export async function setNotificationPrefs(
  userId: string,
  prefs: Partial<Pick<NotificationPrefs, 'push_enabled' | 'email_enabled'>>,
): Promise<NotificationPrefs> {
  const { data, error } = await supabase
    .from('notification_prefs')
    .upsert({ user_id: userId, ...prefs }, { onConflict: 'user_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}
