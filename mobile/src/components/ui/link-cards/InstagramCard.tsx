import React from 'react';
import { Pressable, StyleSheet, View, Image, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { fetchedLinkType } from '@/types';

type Props = { link: fetchedLinkType; onLongPress?: () => void };



function getHandle(url: string): string {
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean);
    return parts[0] ? `@${parts[0]}` : '@user';
  } catch {
    return '@user';
  }
}

export function InstagramCard({ link, onLongPress }: Props) {
  const theme = useTheme();
  const open = () =>
    WebBrowser.openBrowserAsync(link.link).catch(() => Linking.openURL(link.link));

  const handle = getHandle(link.link);

  return (
    <Pressable
      onPress={open}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border, opacity: pressed ? 0.85 : 1 },
      ]}
      android_ripple={{ color: theme.backgroundSelected, borderless: false }}
    >
      {/* Instagram gradient accent bar */}
      <View style={styles.gradientBar} />

      <View style={styles.body}>
        {/* Avatar ring */}
        <View style={styles.ring}>
          {link.image ? (
            <Image source={{ uri: link.image }} style={styles.avatar} />
          ) : (
            <ThemedView type="backgroundSelected" style={[styles.avatar, styles.avatarFallback]}>
              <ThemedText style={styles.avatarEmoji}>📷</ThemedText>
            </ThemedView>
          )}
        </View>

        <View style={styles.text}>
          <ThemedText style={styles.handle}>{handle}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Instagram
          </ThemedText>
          {link.description ? (
            <ThemedText numberOfLines={2} themeColor="textSecondary" style={styles.bio}>
              {link.description}
            </ThemedText>
          ) : null}
        </View>

        {/* Instagram brand icon */}
        <ThemedView type="backgroundSelected" style={styles.brandWrap}>
          <ThemedText style={styles.brandEmoji}>📸</ThemedText>
        </ThemedView>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.three,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.two,
  },
  gradientBar: {
    height: 4,
    // React Native doesn't support CSS linear-gradient natively without a library.
    // Using a solid Instagram purple as a close approximation.
    backgroundColor: '#833ab4',
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    gap: Spacing.two,
  },
  ring: {
    padding: 2,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#fd1d1d',
  },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 24 },
  text: { flex: 1, gap: 2 },
  handle: { fontWeight: '700', fontSize: 14 },
  bio: { fontSize: 12, marginTop: 2 },
  brandWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandEmoji: { fontSize: 18 },
});
