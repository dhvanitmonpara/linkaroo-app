import React from 'react';
import { Pressable, StyleSheet, View, Image, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { fetchedLinkType } from '@/types';

type Props = { link: fetchedLinkType; onLongPress?: () => void };

function getSource(url: string): { label: string; color: string } {
  try {
    const host = new URL(url).hostname.replace('www.', '');
    if (host.includes('imdb')) return { label: 'IMDb', color: '#F5C518' };
    if (host.includes('letterboxd')) return { label: 'Letterboxd', color: '#00b020' };
    if (host.includes('rottentomatoes')) return { label: 'Rotten Tomatoes', color: '#FA320A' };
    return { label: host, color: '#888' };
  } catch {
    return { label: 'Movie', color: '#888' };
  }
}

function extractRating(description: string): string | null {
  // Crude: look for patterns like "7.8/10", "8.2", "98%"
  const match = description.match(/(\d+\.?\d*)\s*\/\s*10|(\d{1,2})\s*%/);
  return match ? match[0] : null;
}

export function MovieCard({ link, onLongPress }: Props) {
  const theme = useTheme();
  const open = () =>
    WebBrowser.openBrowserAsync(link.link).catch(() => Linking.openURL(link.link));

  const { label: sourceLabel, color: sourceColor } = getSource(link.link);
  const rating = link.description ? extractRating(link.description) : null;

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
      {/* Portrait poster */}
      <View style={styles.posterWrapper}>
        {link.image ? (
          <Image source={{ uri: link.image }} style={styles.poster} resizeMode="cover" />
        ) : (
          <ThemedView type="backgroundSelected" style={[styles.poster, styles.posterFallback]}>
            <ThemedText style={styles.posterEmoji}>🎬</ThemedText>
          </ThemedView>
        )}
        {/* Rating badge */}
        {rating && (
          <View style={[styles.ratingBadge, { backgroundColor: sourceColor }]}>
            <ThemedText style={styles.ratingText}>⭐ {rating}</ThemedText>
          </View>
        )}
      </View>

      {/* Details */}
      <View style={styles.details}>
        <View style={[styles.sourcePill, { backgroundColor: sourceColor + '22', borderColor: sourceColor + '55' }]}>
          <ThemedText style={[styles.sourceText, { color: sourceColor }]}>
            {sourceLabel}
          </ThemedText>
        </View>

        <ThemedText numberOfLines={3} style={styles.title}>
          {link.title || 'Movie'}
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
    minHeight: 150,
  },
  posterWrapper: { width: 100, position: 'relative', flexShrink: 0 },
  poster: { width: '100%', height: '100%' },
  posterFallback: { alignItems: 'center', justifyContent: 'center' },
  posterEmoji: { fontSize: 36 },
  ratingBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 4,
    alignItems: 'center',
  },
  ratingText: { fontSize: 11, fontWeight: '700', color: '#000' },
  details: {
    flex: 1,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  sourcePill: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    marginBottom: Spacing.one,
  },
  sourceText: { fontSize: 11, fontWeight: '700' },
  title: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  desc: { fontSize: 12, lineHeight: 17 },
});
