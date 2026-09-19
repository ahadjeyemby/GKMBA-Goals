import { supabase } from '@/lib/supabase';
import type { DailyCheckin, HundredDayGoal, HundredDayProgress, WeeklyGoal } from '@/types/database';

// --- Weekly goals + check-ins ---------------------------------------------

export async function upsertWeeklyGoal(
  weekId: string,
  userId: string,
  goalNumber: 1 | 2 | 3,
  text: string,
): Promise<WeeklyGoal> {
  const { data, error } = await supabase
    .from('weekly_goals')
    .upsert(
      { week_id: weekId, user_id: userId, goal_number: goalNumber, text },
      { onConflict: 'week_id,user_id,goal_number' },
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getWeeklyGoals(weekId: string, userId: string): Promise<WeeklyGoal[]> {
  const { data, error } = await supabase
    .from('weekly_goals')
    .select()
    .eq('week_id', weekId)
    .eq('user_id', userId)
    .order('goal_number');
  if (error) throw error;
  return data ?? [];
}

export async function getCheckins(weeklyGoalIds: string[]): Promise<DailyCheckin[]> {
  if (weeklyGoalIds.length === 0) return [];
  const { data, error } = await supabase
    .from('daily_checkins')
    .select()
    .in('weekly_goal_id', weeklyGoalIds);
  if (error) throw error;
  return data ?? [];
}

export async function setCheckin(
  weeklyGoalId: string,
  dayOfWeek: number,
  completed: boolean,
): Promise<DailyCheckin> {
  const { data, error } = await supabase
    .from('daily_checkins')
    .upsert(
      {
        weekly_goal_id: weeklyGoalId,
        day_of_week: dayOfWeek,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      },
      { onConflict: 'weekly_goal_id,day_of_week' },
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

// --- 100-day goals ----------------------------------------------------------

export async function upsertHundredDayGoal(
  seasonId: string,
  userId: string,
  goalNumber: 1 | 2 | 3,
  text: string,
  rewardText: string | null,
): Promise<HundredDayGoal> {
  const { data, error } = await supabase
    .from('hundred_day_goals')
    .upsert(
      { season_id: seasonId, user_id: userId, goal_number: goalNumber, text, reward_text: rewardText },
      { onConflict: 'season_id,user_id,goal_number' },
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getHundredDayGoals(seasonId: string, userId: string): Promise<HundredDayGoal[]> {
  const { data, error } = await supabase
    .from('hundred_day_goals')
    .select()
    .eq('season_id', seasonId)
    .eq('user_id', userId)
    .order('goal_number');
  if (error) throw error;
  return data ?? [];
}

export async function getHundredDayProgress(goalIds: string[]): Promise<HundredDayProgress[]> {
  if (goalIds.length === 0) return [];
  const { data, error } = await supabase
    .from('hundred_day_progress')
    .select()
    .in('hundred_day_goal_id', goalIds);
  if (error) throw error;
  return data ?? [];
}

export async function setHundredDayProgress(
  goalId: string,
  weekNumber: number,
  completed: boolean,
): Promise<HundredDayProgress> {
  const { data, error } = await supabase
    .from('hundred_day_progress')
    .upsert(
      { hundred_day_goal_id: goalId, week_number: weekNumber, completed },
      { onConflict: 'hundred_day_goal_id,week_number' },
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}
