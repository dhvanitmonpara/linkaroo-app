import React from 'react';
import { Pressable, StyleSheet, View, Linking } from 'react-native';
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

export function TwitterCard({ link, onLongPress }: Props) {
  const theme = useTheme();
  const open = () =>
    WebBrowser.openBrowserAsync(link.link).catch(() => Linking.openURL(link.link));

  const handle = getHandle(link.link);
  const isX = link.link.includes('x.com');

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
      {/* Header row */}
      <View style={styles.header}>
        <ThemedView type="backgroundSelected" style={styles.avatar}>
          <ThemedText style={styles.avatarEmoji}>𝕏</ThemedText>
        </ThemedView>
        <View style={styles.headerText}>
          <ThemedText style={styles.handle}>{handle}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {isX ? 'x.com' : 'twitter.com'}
          </ThemedText>
        </View>
        {/* X / Twitter bird logo badge */}
        <View style={[styles.brand, { backgroundColor: isX ? '#000' : '#1DA1F2' }]}>
          <ThemedText style={styles.brandText}>{isX ? '𝕏' : '🐦'}</ThemedText>
        </View>
      </View>

      {/* Quote bubble */}
      {link.description ? (
        <ThemedView
          type="backgroundSelected"
          style={[styles.bubble, { borderColor: theme.border }]}
        >
          <ThemedText numberOfLines={4} style={styles.tweetText}>
            {link.description}
          </ThemedText>
        </ThemedView>
      ) : (
        <View style={styles.placeholder}>
          <ThemedText themeColor="textSecondary" style={styles.placeholderText}>
            {link.title || 'View tweet'}
          </ThemedText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.three,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.two,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 18, fontWeight: '700' },
  headerText: { flex: 1 },
  handle: { fontWeight: '700', fontSize: 14 },
  brand: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: { fontSize: 14, color: '#fff' },
  bubble: {
    borderRadius: Spacing.two,
    borderWidth: 1,
    padding: Spacing.two,
  },
  tweetText: { fontSize: 14, lineHeight: 20 },
  placeholder: { paddingVertical: Spacing.one },
  placeholderText: { fontSize: 14 },
});
