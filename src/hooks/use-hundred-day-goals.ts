import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useCurrentGroup } from '@/hooks/use-current-group';
import {
  getHundredDayGoals,
  getHundredDayProgress,
  setHundredDayProgress,
  upsertHundredDayGoal,
} from '@/lib/api/goals';
import { weekNumberFor } from '@/lib/api/seasons';

export interface HundredDayGoalWithProgress {
  id: string | null;
  goalNumber: 1 | 2 | 3;
  text: string;
  rewardText: string;
  weeksTicked: boolean[]; // index 0 = week 1
}

export function useHundredDayGoals() {
  const { userId, season } = useCurrentGroup();
  const queryClient = useQueryClient();

  const weeksElapsed = season ? weekNumberFor(season.start_date, new Date()) : 0;

  const goalsQuery = useQuery({
    queryKey: ['hundred-day-goals', season?.id, userId],
    queryFn: async () => {
      const goals = await getHundredDayGoals(season!.id, userId!);
      const progress = await getHundredDayProgress(goals.map((g) => g.id));
      const bySlot: HundredDayGoalWithProgress[] = [1, 2, 3].map((goalNumber) => {
        const goal = goals.find((g) => g.goal_number === goalNumber);
        const weeksTicked = Array(season?.week_count ?? 0).fill(false);
        if (goal) {
          progress
            .filter((p) => p.hundred_day_goal_id === goal.id)
            .forEach((p) => {
              weeksTicked[p.week_number - 1] = p.completed;
            });
        }
        return {
          id: goal?.id ?? null,
          goalNumber: goalNumber as 1 | 2 | 3,
          text: goal?.text ?? '',
          rewardText: goal?.reward_text ?? '',
          weeksTicked,
        };
      });
      return bySlot;
    },
    enabled: !!season && !!userId,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['hundred-day-goals', season?.id, userId] });

  const saveGoal = useMutation({
    mutationFn: (params: { goalNumber: 1 | 2 | 3; text: string; rewardText: string }) =>
      upsertHundredDayGoal(season!.id, userId!, params.goalNumber, params.text, params.rewardText || null),
    onSuccess: invalidate,
  });

  const toggleWeek = useMutation({
    mutationFn: (params: { goalId: string; weekNumber: number; completed: boolean }) =>
      setHundredDayProgress(params.goalId, params.weekNumber, params.completed),
    onSuccess: invalidate,
  });

  return {
    goals: goalsQuery.data ?? [],
    isLoading: goalsQuery.isLoading,
    weeksElapsed,
    saveGoal: saveGoal.mutateAsync,
    toggleWeek: toggleWeek.mutateAsync,
  };
}
