import React from 'react';
import { Pressable, StyleSheet, View, Image, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { fetchedLinkType } from '@/types';

type Props = { link: fetchedLinkType; onLongPress?: () => void };

function getSource(url: string): string {
  try {
    const host = new URL(url).hostname.replace('www.', '');
    if (host.includes('goodreads')) return 'Goodreads';
    if (host.includes('books.google')) return 'Google Books';
    if (host.includes('openlibrary')) return 'Open Library';
    return host;
  } catch {
    return 'Book';
  }
}

export function BookCard({ link, onLongPress }: Props) {
  const theme = useTheme();
  const open = () =>
    WebBrowser.openBrowserAsync(link.link).catch(() => Linking.openURL(link.link));

  const source = getSource(link.link);

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
      {/* Portrait cover */}
      <View style={styles.coverWrapper}>
        {link.image ? (
          <Image source={{ uri: link.image }} style={styles.cover} resizeMode="cover" />
        ) : (
          <ThemedView type="backgroundSelected" style={[styles.cover, styles.coverFallback]}>
            <ThemedText style={styles.coverEmoji}>📚</ThemedText>
          </ThemedView>
        )}
        {/* Spine shadow effect */}
        <View style={styles.spineHighlight} />
      </View>

      {/* Details */}
      <View style={styles.details}>
        {/* Source badge */}
        <ThemedView type="backgroundSelected" style={styles.sourceBadge}>
          <ThemedText style={styles.sourceText}>📖 {source}</ThemedText>
        </ThemedView>

        <ThemedText numberOfLines={3} style={styles.title}>
          {link.title || 'Book'}
        </ThemedText>

        {link.description ? (
          <ThemedText numberOfLines={3} themeColor="textSecondary" style={styles.desc}>
            {link.description}
          </ThemedText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: Spacing.three,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.two,
    minHeight: 140,
  },
  coverWrapper: {
    width: 90,
    position: 'relative',
    flexShrink: 0,
  },
  cover: { width: '100%', height: '100%' },
  coverFallback: { alignItems: 'center', justifyContent: 'center' },
  coverEmoji: { fontSize: 32 },
  // Simulates book spine left-edge highlight
  spineHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  details: {
    flex: 1,
    padding: Spacing.three,
    gap: Spacing.one,
    justifyContent: 'flex-start',
  },
  sourceBadge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    marginBottom: Spacing.one,
  },
  sourceText: { fontSize: 11, fontWeight: '600' },
  title: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  desc: { fontSize: 12, lineHeight: 17 },
});
