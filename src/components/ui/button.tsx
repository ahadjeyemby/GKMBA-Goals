import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';

interface ButtonProps {
  children: ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
}

export function Button({ children, onPress, variant = 'primary', disabled, loading }: ButtonProps) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`items-center justify-center rounded-xl px-4 py-3 ${
        isPrimary ? 'bg-ledger-red' : 'border border-ledger-gray/40 bg-transparent'
      } ${disabled || loading ? 'opacity-50' : ''}`}>
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#fff' : '#D21F3C'} />
      ) : (
        <Text className={`text-base font-semibold ${isPrimary ? 'text-white' : 'text-ledger-red'}`}>
          {children}
        </Text>
      )}
    </Pressable>
  );
}
