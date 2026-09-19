import { Text, View } from 'react-native';

import { statusColor, statusForPct } from '@/lib/scoring';

export function StatusBadge({ pct }: { pct: number }) {
  const status = statusForPct(pct);
  const color = statusColor[status];
  return (
    <View
      className="flex-row items-center gap-2 self-start rounded-full px-3 py-1"
      style={{ backgroundColor: `${color}1A` }}>
      <View className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      <Text className="text-sm font-semibold" style={{ color }}>
        {Math.round(pct * 100)}%
      </Text>
    </View>
  );
}
