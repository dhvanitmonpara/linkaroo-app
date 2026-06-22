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
import { useSignUp } from '@clerk/clerk-expo';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function SignUpScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { signUp, setActive, isLoaded } = useSignUp();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!isLoaded) return;
    if (!email.trim() || !password || !firstName.trim()) {
      Alert.alert('Missing fields', 'Please fill in all required fields');
      return;
    }
    try {
      setLoading(true);
      await signUp.create({
        emailAddress: email.trim().toLowerCase(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        'Sign-up failed. Please try again.';
      Alert.alert('Sign-up error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!isLoaded || !otp.trim()) return;
    try {
      setLoading(true);
      const result = await signUp.attemptEmailAddressVerification({ code: otp });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(tabs)/index' as any);
      }
    } catch (err: any) {
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        'Verification failed. Try again.';
      Alert.alert('Verification error', msg);
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

          {!pendingVerification ? (
            <>
              <View style={styles.heading}>
                <ThemedText type="subtitle" style={styles.title}>
                  Create account
                </ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.subtitle}>
                  Start organizing your links today
                </ThemedText>
              </View>

              <View style={styles.form}>
                <View style={styles.row}>
                  <View style={styles.halfField}>
                    <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
                      FIRST NAME
                    </ThemedText>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: theme.border }]}
                      placeholder="First"
                      placeholderTextColor={theme.textSecondary}
                      value={firstName}
                      onChangeText={setFirstName}
                      autoCapitalize="words"
                    />
                  </View>
                  <View style={styles.halfField}>
                    <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
                      LAST NAME
                    </ThemedText>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: theme.border }]}
                      placeholder="Last"
                      placeholderTextColor={theme.textSecondary}
                      value={lastName}
                      onChangeText={setLastName}
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                <View style={styles.field}>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
                    EMAIL
                  </ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: theme.border }]}
                    placeholder="you@example.com"
                    placeholderTextColor={theme.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                  />
                </View>

                <View style={styles.field}>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
                    PASSWORD
                  </ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: theme.border }]}
                    placeholder="Min 8 characters"
                    placeholderTextColor={theme.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    returnKeyType="done"
                    onSubmitEditing={handleSignUp}
                  />
                </View>

                <Pressable
                  onPress={handleSignUp}
                  disabled={loading}
                  style={[styles.btn, { backgroundColor: theme.primary, opacity: loading ? 0.7 : 1 }]}
                >
                  {loading ? (
                    <LoadingSpinner size="small" />
                  ) : (
                    <ThemedText style={styles.btnText}>Create Account</ThemedText>
                  )}
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <View style={styles.heading}>
                <ThemedText style={styles.verifyIcon}>📧</ThemedText>
                <ThemedText type="subtitle" style={styles.title}>
                  Check your inbox
                </ThemedText>
                <ThemedText themeColor="textSecondary" style={[styles.subtitle, { textAlign: 'center' }]}>
                  We sent a verification code to{'\n'}{email}
                </ThemedText>
              </View>

              <View style={styles.form}>
                <View style={styles.field}>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
                    VERIFICATION CODE
                  </ThemedText>
                  <TextInput
                    style={[styles.input, styles.otpInput, { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: theme.border }]}
                    placeholder="000000"
                    placeholderTextColor={theme.textSecondary}
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                    textAlign="center"
                  />
                </View>
                <Pressable
                  onPress={handleVerify}
                  disabled={loading}
                  style={[styles.btn, { backgroundColor: theme.primary, opacity: loading ? 0.7 : 1 }]}
                >
                  {loading ? (
                    <LoadingSpinner size="small" />
                  ) : (
                    <ThemedText style={styles.btnText}>Verify Email</ThemedText>
                  )}
                </Pressable>
              </View>
            </>
          )}

          <View style={styles.footer}>
            <ThemedText themeColor="textSecondary">Already have an account? </ThemedText>
            <Pressable onPress={() => router.push('/(auth)/sign-in')}>
              <ThemedText style={{ color: theme.primary, fontWeight: '700' }}>
                Sign In
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
  logo: { width: 36, height: 36 },
  brand: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  heading: { gap: 6, alignItems: 'center' },
  verifyIcon: { fontSize: 48 },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center' },
  subtitle: { fontSize: 15 },
  form: { gap: Spacing.three },
  row: { flexDirection: 'row', gap: Spacing.two },
  halfField: { flex: 1, gap: 6 },
  field: { gap: 6 },
  label: { fontSize: 11, letterSpacing: 1, fontWeight: '700' },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 4,
    fontSize: 16,
  },
  otpInput: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 8,
    paddingVertical: Spacing.three,
  },
  btn: {
    borderRadius: 14,
    paddingVertical: Spacing.two + 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.one,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: Spacing.two,
  },
});
