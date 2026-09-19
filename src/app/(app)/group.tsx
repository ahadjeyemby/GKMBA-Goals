import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextField } from '@/components/ui/text-field';
import { useAuth } from '@/hooks/use-auth';
import { useCurrentGroup } from '@/hooks/use-current-group';
import { addComment, getComments } from '@/lib/api/comments';
import { getWeeklyGoals } from '@/lib/api/goals';
import { getGroupRoster, type RosterEntry } from '@/lib/api/groups';
import { getWeekStatsForGroup } from '@/lib/api/stats';
import { teamAveragePct, weeklyPct } from '@/lib/scoring';

export default function GroupScreen() {
  const { session } = useAuth();
  const { group, week, isLoading: groupLoading } = useCurrentGroup();
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  const rosterQuery = useQuery({
    queryKey: ['roster', group?.id],
    queryFn: () => getGroupRoster(group!.id),
    enabled: !!group,
  });

  const statsQuery = useQuery({
    queryKey: ['week-stats', week?.id],
    queryFn: () => getWeekStatsForGroup(week!.id),
    enabled: !!week,
  });

  if (groupLoading || rosterQuery.isLoading || statsQuery.isLoading) {
    return (
      <Screen>
        <ActivityIndicator color="#C2255C" className="mt-16" />
      </Screen>
    );
  }

  const statsByUser = new Map((statsQuery.data ?? []).map((s) => [s.userId, s]));
  const roster = rosterQuery.data ?? [];
  const memberPcts = roster.map((entry) => {
    const stats = statsByUser.get(entry.profile.id);
    return stats ? weeklyPct(stats.goals) : 0;
  });
  const teamAvg = teamAveragePct(memberPcts);

  return (
    <Screen>
      <View className="mt-2 gap-1">
        <Text className="text-2xl font-bold">{group?.name}</Text>
        <Text className="text-sm text-ledger-gray">Invite code: {group?.invite_code}</Text>
      </View>

      <View className="flex-row items-center justify-between rounded-2xl bg-ledger-red/10 p-4">
        <Text className="text-base font-semibold text-ledger-red">Weekly Team Average</Text>
        <StatusBadge pct={teamAvg} />
      </View>

      {roster.map((entry, i) => (
        <MemberRow
          key={entry.profile.id}
          entry={entry}
          pct={memberPcts[i]}
          expanded={expandedUserId === entry.profile.id}
          onToggle={() =>
            setExpandedUserId(expandedUserId === entry.profile.id ? null : entry.profile.id)
          }
          weekId={week?.id ?? null}
          viewerId={session?.user.id ?? ''}
          isSelf={entry.profile.id === session?.user.id}
        />
      ))}
    </Screen>
  );
}

function MemberRow({
  entry,
  pct,
  expanded,
  onToggle,
  weekId,
  viewerId,
  isSelf,
}: {
  entry: RosterEntry;
  pct: number;
  expanded: boolean;
  onToggle: () => void;
  weekId: string | null;
  viewerId: string;
  isSelf: boolean;
}) {
  const goalsQuery = useQuery({
    queryKey: ['member-week-goals', weekId, entry.profile.id],
    queryFn: () => getWeeklyGoals(weekId!, entry.profile.id),
    enabled: expanded && !!weekId,
  });

  return (
    <View className="rounded-2xl border border-ledger-gray/20 p-4">
      <Pressable onPress={onToggle} className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: entry.profile.signature_color }}
          />
          <Text className="text-base font-medium">{entry.profile.display_name}</Text>
        </View>
        <StatusBadge pct={pct} />
      </Pressable>

      {expanded ? (
        <View className="mt-3 gap-3 border-t border-ledger-gray/10 pt-3">
          {(goalsQuery.data ?? []).map((goal) => (
            <GoalComments key={goal.id} goalId={goal.id} goalText={goal.text} viewerId={viewerId} isSelf={isSelf} />
          ))}
          {goalsQuery.isSuccess && (goalsQuery.data ?? []).length === 0 ? (
            <Text className="text-sm text-ledger-gray">No goals set for this week yet.</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function GoalComments({
  goalId,
  goalText,
  viewerId,
  isSelf,
}: {
  goalId: string;
  goalText: string;
  viewerId: string;
  isSelf: boolean;
}) {
  const [body, setBody] = useState('');
  const commentsQuery = useQuery({
    queryKey: ['comments', 'weekly_goal', goalId],
    queryFn: () => getComments('weekly_goal', goalId),
  });

  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold">{goalText}</Text>
      {(commentsQuery.data ?? []).map((c) => (
        <Text key={c.id} className="text-sm text-ledger-gray">
          {c.body}
        </Text>
      ))}
      {!isSelf ? (
        <View className="flex-row gap-2">
          <View className="flex-1">
            <TextField placeholder="Leave a comment" value={body} onChangeText={setBody} />
          </View>
          <Button
            variant="secondary"
            disabled={!body.trim()}
            onPress={async () => {
              await addComment('weekly_goal', goalId, viewerId, body.trim());
              setBody('');
              commentsQuery.refetch();
            }}>
            Post
          </Button>
        </View>
      ) : (
        <Text className="text-xs italic text-ledger-gray">
          Comments here come from other members, not you.
        </Text>
      )}
    </View>
  );
}
