import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const Container = scroll ? ScrollView : View;
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-ledger-dark" edges={['top']}>
      <Container
        className="flex-1"
        contentContainerClassName={scroll ? 'px-4 pb-8 pt-2 gap-4' : undefined}
        style={scroll ? undefined : { flex: 1, padding: 16, gap: 16 }}>
        {children}
      </Container>
    </SafeAreaView>
  );
}
