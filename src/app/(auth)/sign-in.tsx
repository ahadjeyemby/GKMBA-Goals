import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Screen } from '@/components/ui/screen';
import { useAuth } from '@/hooks/use-auth';

export default function SignIn() {
  const { signInWithPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      await signInWithPassword(email.trim(), password);
      router.replace('/(app)/today');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View className="mt-16 gap-1">
        <Text className="text-3xl font-bold text-ledger-red">THE LEDGER</Text>
        <Text className="text-base text-ledger-gray">No excuses. Just receipts.</Text>
      </View>

      <View className="mt-8 gap-3">
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry />
        {error ? <Text className="text-sm text-status-red">{error}</Text> : null}
        <Button onPress={handleSubmit} loading={loading}>
          Sign In
        </Button>
      </View>

      <Link href="/(auth)/sign-up" className="mt-4 text-center text-sm text-ledger-gray">
        Don&apos;t have an account? <Text className="font-semibold text-ledger-red">Sign up</Text>
      </Link>
    </Screen>
  );
}
