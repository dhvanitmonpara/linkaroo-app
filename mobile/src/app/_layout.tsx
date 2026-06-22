import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import api, { setAuthToken } from '@/lib/api';
import useAuthStore from '@/store/authStore';

// Clerk token cache using expo-secure-store
const tokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {}
  },
  async clearToken(key: string) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {}
  },
};

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

// Inner component: handles auth guard + profile fetch
function RootInner() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const router = useRouter();
  const { setProfile, setToken, clearAuth } = useAuthStore();

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isSignedIn && !inAuthGroup) {
      router.replace('/(auth)/sign-in' as any);
    } else if (isSignedIn && inAuthGroup) {
      router.replace('/(tabs)/index' as any);
    }
  }, [isLoaded, isSignedIn, segments]);

  // Inject Clerk token into Axios interceptor + fetch user profile
  useEffect(() => {
    if (!isSignedIn || !isLoaded) {
      setAuthToken(null);
      return;
    }
    (async () => {
      try {
        const token = await getToken();
        if (token) {
          setAuthToken(token);
          setToken(token);
        }
        // Fetch user profile from our backend
        const res = await api.get('/users/me');
        if (res.status === 200 && res.data?.data) {
          setProfile(res.data.data);
        }
      } catch (err) {
        console.warn('Could not fetch user profile:', err);
      }
    })();
  }, [isSignedIn, isLoaded]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  if (!publishableKey) {
    console.warn(
      '[Linkaroo] EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is not set.\n' +
      'Create mobile/.env with your Clerk publishable key to enable auth.'
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <RootInner />
    </ClerkProvider>
  );
}
