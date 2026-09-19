import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useCurrentGroup } from '@/hooks/use-current-group';
import { getCheckins, getWeeklyGoals, setCheckin, upsertWeeklyGoal } from '@/lib/api/goals';

export interface WeeklyGoalWithCheckins {
  id: string | null; // null until the member has set text for this slot
  goalNumber: 1 | 2 | 3;
  text: string;
  completedDays: boolean[]; // index 0=Mon .. 6=Sun
}

export function useWeeklyGoals() {
  const { userId, week } = useCurrentGroup();
  const queryClient = useQueryClient();

  const goalsQuery = useQuery({
    queryKey: ['weekly-goals', week?.id, userId],
    queryFn: async () => {
      const goals = await getWeeklyGoals(week!.id, userId!);
      const checkins = await getCheckins(goals.map((g) => g.id));
      const bySlot: WeeklyGoalWithCheckins[] = [1, 2, 3].map((goalNumber) => {
        const goal = goals.find((g) => g.goal_number === goalNumber);
        const completedDays = Array(7).fill(false);
        if (goal) {
          checkins
            .filter((c) => c.weekly_goal_id === goal.id)
            .forEach((c) => {
              completedDays[c.day_of_week] = c.completed;
            });
        }
        return {
          id: goal?.id ?? null,
          goalNumber: goalNumber as 1 | 2 | 3,
          text: goal?.text ?? '',
          completedDays,
        };
      });
      return bySlot;
    },
    enabled: !!week && !!userId,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['weekly-goals', week?.id, userId] });

  const setGoalText = useMutation({
    mutationFn: (params: { goalNumber: 1 | 2 | 3; text: string }) =>
      upsertWeeklyGoal(week!.id, userId!, params.goalNumber, params.text),
    onSuccess: invalidate,
  });

  const toggleDay = useMutation({
    mutationFn: (params: { weeklyGoalId: string; dayOfWeek: number; completed: boolean }) =>
      setCheckin(params.weeklyGoalId, params.dayOfWeek, params.completed),
    onSuccess: invalidate,
  });

  return {
    goals: goalsQuery.data ?? [],
    isLoading: goalsQuery.isLoading,
    setGoalText: setGoalText.mutateAsync,
    toggleDay: toggleDay.mutateAsync,
  };
}
