import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/hooks/use-auth';
import { getMyGroups } from '@/lib/api/groups';
import { getCurrentSeason, getOrCreateCurrentWeek } from '@/lib/api/seasons';

/**
 * V1 assumption: a member belongs to one active group at a time (the first
 * one returned). A group switcher is a natural follow-up once someone needs
 * to juggle multiple groups.
 */
export function useCurrentGroup() {
  const { session } = useAuth();
  const userId = session?.user.id;

  const groupsQuery = useQuery({
    queryKey: ['my-groups', userId],
    queryFn: () => getMyGroups(userId!),
    enabled: !!userId,
  });

  const group = groupsQuery.data?.[0] ?? null;

  const seasonQuery = useQuery({
    queryKey: ['current-season', group?.id],
    queryFn: () => getCurrentSeason(group!.id),
    enabled: !!group,
  });

  const season = seasonQuery.data ?? null;

  const weekQuery = useQuery({
    queryKey: ['current-week', season?.id],
    queryFn: () => getOrCreateCurrentWeek(season!),
    enabled: !!season,
  });

  return {
    userId,
    group,
    season,
    week: weekQuery.data ?? null,
    isLoading: groupsQuery.isLoading || seasonQuery.isLoading || weekQuery.isLoading,
    hasNoGroup: groupsQuery.isSuccess && groupsQuery.data.length === 0,
  };
}
