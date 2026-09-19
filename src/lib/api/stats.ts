import { supabase } from '@/lib/supabase';

export interface MemberWeekStats {
  userId: string;
  goals: { completedDays: boolean[] }[];
}

/** All members' goals + check-ins for a week, for computing per-member % and the team average. */
export async function getWeekStatsForGroup(weekId: string): Promise<MemberWeekStats[]> {
  const { data: goals, error: goalsError } = await supabase
    .from('weekly_goals')
    .select('id, user_id')
    .eq('week_id', weekId);
  if (goalsError) throw goalsError;
  if (!goals || goals.length === 0) return [];

  const { data: checkins, error: checkinsError } = await supabase
    .from('daily_checkins')
    .select('weekly_goal_id, day_of_week, completed')
    .in(
      'weekly_goal_id',
      goals.map((g) => g.id),
    );
  if (checkinsError) throw checkinsError;

  const byUser = new Map<string, { completedDays: boolean[] }[]>();
  for (const goal of goals) {
    const completedDays = Array(7).fill(false);
    (checkins ?? [])
      .filter((c) => c.weekly_goal_id === goal.id)
      .forEach((c) => {
        completedDays[c.day_of_week] = c.completed;
      });
    const existing = byUser.get(goal.user_id) ?? [];
    existing.push({ completedDays });
    byUser.set(goal.user_id, existing);
  }

  return Array.from(byUser.entries()).map(([userId, goalList]) => ({ userId, goals: goalList }));
}
