import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { useAuth } from '@/hooks/use-auth';

export default function SignUp() {
  const { signUpWithPassword } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      await signUpWithPassword(email.trim(), password, displayName.trim());
      router.replace('/(auth)/onboarding');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View className="mt-16 gap-1">
        <Text className="text-3xl font-bold text-ledger-red">Create your account</Text>
        <Text className="text-base text-ledger-gray">Set your goals. Show your receipts.</Text>
      </View>

      <View className="mt-8 gap-3">
        <TextField label="Name" value={displayName} onChangeText={setDisplayName} />
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry />
        {error ? <Text className="text-sm text-status-red">{error}</Text> : null}
        <Button onPress={handleSubmit} loading={loading} disabled={!displayName || !email || !password}>
          Sign Up
        </Button>
      </View>

      <Link href="/(auth)/sign-in" className="mt-4 text-center text-sm text-ledger-gray">
        Already have an account? <Text className="font-semibold text-ledger-red">Sign in</Text>
      </Link>
    </Screen>
  );
}
