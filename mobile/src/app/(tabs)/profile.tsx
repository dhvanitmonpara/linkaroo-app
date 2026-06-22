import React, { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import useAuthStore from '@/store/authStore';
import useCollectionsStore from '@/store/collectionStore';
import useLinkStore from '@/store/linkStore';
import { useColorScheme } from '@/hooks/use-color-scheme';

type RowProps = {
  icon: string;
  label: string;
  right?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
};

function Row({ icon, label, right, onPress, danger }: RowProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.75 : 1 },
      ]}
      android_ripple={{ color: theme.backgroundSelected }}
    >
      <ThemedText style={styles.rowIcon}>{icon}</ThemedText>
      <ThemedText
        style={[styles.rowLabel, danger && { color: theme.danger }]}
      >
        {label}
      </ThemedText>
      {right && <View style={styles.rowRight}>{right}</View>}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut } = useAuth();
  const { user } = useUser();
  const profile = useAuthStore((s) => s.profile);
  const { clearAuth } = useAuthStore();
  const { reset: resetCollections } = useCollectionsStore();
  const { reset: resetLinks } = useLinkStore();
  const colorScheme = useColorScheme();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            setSigningOut(true);
            await signOut();
            clearAuth();
            resetCollections();
            resetLinks();
            router.replace('/(auth)/sign-in');
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to sign out');
          } finally {
            setSigningOut(false);
          }
        },
      },
    ]);
  };

  const paddingBottom = BottomTabInset + Spacing.four;

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + Spacing.four,
            paddingBottom,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar + name */}
        <View style={styles.hero}>
          {user?.imageUrl ? (
            <Image
              source={{ uri: user.imageUrl }}
              style={[styles.avatar, { borderColor: theme.primary }]}
            />
          ) : (
            <ThemedView
              type="backgroundElement"
              style={[styles.avatar, styles.avatarFallback, { borderColor: theme.border }]}
            >
              <ThemedText style={styles.avatarEmoji}>
                {(profile?.fullName || profile?.username || '?')[0].toUpperCase()}
              </ThemedText>
            </ThemedView>
          )}
          <ThemedText type="subtitle" style={styles.name}>
            {profile?.fullName || user?.fullName || profile?.username}
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.email}>
            {profile?.email || user?.primaryEmailAddress?.emailAddress}
          </ThemedText>
          {profile?.username && (
            <ThemedView
              type="backgroundElement"
              style={[styles.usernameBadge, { borderColor: theme.border }]}
            >
              <ThemedText type="small" themeColor="textSecondary">
                @{profile.username}
              </ThemedText>
            </ThemedView>
          )}
        </View>

        {/* Account section */}
        <View style={styles.section}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
            ACCOUNT
          </ThemedText>
          <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <Row icon="👤" label="Username" right={
              <ThemedText themeColor="textSecondary">@{profile?.username}</ThemedText>
            } />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <Row icon="✉️" label="Email" right={
              <ThemedText themeColor="textSecondary" numberOfLines={1} style={{ maxWidth: 180 }}>
                {profile?.email}
              </ThemedText>
            } />
          </View>
        </View>

        {/* App section */}
        <View style={styles.section}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
            APP
          </ThemedText>
          <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <Row
              icon="🎨"
              label="Appearance"
              right={
                <ThemedText themeColor="textSecondary" style={{ textTransform: 'capitalize' }}>
                  {colorScheme === 'unspecified' ? 'System' : colorScheme}
                </ThemedText>
              }
            />
          </View>
        </View>

        {/* Sign out */}
        <View style={styles.section}>
          <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <Row
              icon="🚪"
              label={signingOut ? 'Signing out...' : 'Sign Out'}
              onPress={handleSignOut}
              danger
            />
          </View>
        </View>

        {/* Version */}
        <ThemedText themeColor="textSecondary" style={styles.version}>
          Linkaroo · v1.0.0
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.four,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.three,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    marginBottom: Spacing.two,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  avatarEmoji: {
    fontSize: 36,
    fontWeight: '700',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
  },
  email: {
    fontSize: 14,
  },
  usernameBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
    marginTop: 4,
  },
  section: { gap: Spacing.two },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 4,
    gap: Spacing.two,
  },
  rowIcon: { fontSize: 18, width: 28, textAlign: 'center' },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  rowRight: { alignItems: 'flex-end' },
  divider: { height: 1, marginLeft: Spacing.three + 28 + Spacing.two },
  version: {
    textAlign: 'center',
    fontSize: 12,
    paddingVertical: Spacing.two,
  },
});
