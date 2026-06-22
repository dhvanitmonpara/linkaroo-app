import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSignIn } from '@clerk/clerk-expo';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function SignInScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { signIn, setActive, isLoaded } = useSignIn();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!isLoaded) return;
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password');
      return;
    }
    try {
      setLoading(true);
      const result = await signIn.create({
        identifier: email.trim().toLowerCase(),
        password,
      });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(tabs)/index' as any);
      }
    } catch (err: any) {
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        'Sign-in failed. Please try again.';
      Alert.alert('Sign-in error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoRow}>
            <Image
              source={require('@/assets/images/splash-icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <ThemedText style={styles.brand}>Linkaroo</ThemedText>
          </View>

          {/* Heading */}
          <View style={styles.heading}>
            <ThemedText type="subtitle" style={styles.title}>
              Welcome back
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.subtitle}>
              Sign in to continue saving links
            </ThemedText>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.field}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
                EMAIL
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: theme.border },
                ]}
                placeholder="you@example.com"
                placeholderTextColor={theme.textSecondary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                returnKeyType="next"
              />
            </View>

            <View style={styles.field}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
                PASSWORD
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: theme.border },
                ]}
                placeholder="••••••••"
                placeholderTextColor={theme.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleSignIn}
              />
            </View>

            <Pressable
              onPress={handleSignIn}
              disabled={loading}
              style={[
                styles.btn,
                { backgroundColor: theme.primary, opacity: loading ? 0.7 : 1 },
              ]}
            >
              {loading ? (
                <LoadingSpinner size="small" />
              ) : (
                <ThemedText style={styles.btnText}>Sign In</ThemedText>
              )}
            </Pressable>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <ThemedText themeColor="textSecondary">
              Don't have an account?{' '}
            </ThemedText>
            <Pressable onPress={() => router.push('/(auth)/sign-up')}>
              <ThemedText style={{ color: theme.primary, fontWeight: '700' }}>
                Sign Up
              </ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.four,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  logo: {
    width: 36,
    height: 36,
  },
  brand: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heading: {
    gap: 6,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 15,
  },
  form: {
    gap: Spacing.three,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: '700',
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 4,
    fontSize: 16,
  },
  btn: {
    borderRadius: 14,
    paddingVertical: Spacing.two + 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.one,
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: Spacing.two,
  },
});
