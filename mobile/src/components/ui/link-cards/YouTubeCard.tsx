import React from 'react';
import { Pressable, StyleSheet, View, Image, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { fetchedLinkType } from '@/types';

type Props = { link: fetchedLinkType; onLongPress?: () => void };

function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1);
    return u.searchParams.get('v');
  } catch {
    return null;
  }
}

export function YouTubeCard({ link, onLongPress }: Props) {
  const theme = useTheme();
  const open = () =>
    WebBrowser.openBrowserAsync(link.link).catch(() => Linking.openURL(link.link));

  const videoId = getYouTubeId(link.link);
  const thumbnailUri =
    link.image ??
    (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null);

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
      {/* 16:9 Thumbnail */}
      <View style={styles.thumbWrapper}>
        {thumbnailUri ? (
          <Image source={{ uri: thumbnailUri }} style={styles.thumbnail} resizeMode="cover" />
        ) : (
          <ThemedView type="backgroundSelected" style={[styles.thumbnail, styles.thumbFallback]}>
            <ThemedText style={styles.playEmoji}>▶</ThemedText>
          </ThemedView>
        )}
        {/* Play button overlay */}
        <View style={styles.playOverlay}>
          <View style={styles.playBtn}>
            <ThemedText style={styles.playIcon}>▶</ThemedText>
          </View>
        </View>
        {/* YouTube brand badge */}
        <View style={[styles.badge, { backgroundColor: '#FF0000' }]}>
          <ThemedText style={styles.badgeText}>YouTube</ThemedText>
        </View>
      </View>

      <View style={[styles.meta, { borderTopColor: theme.border }]}>
        <ThemedText numberOfLines={2} style={styles.title}>
          {link.title || 'YouTube Video'}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          youtube.com
        </ThemedText>
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
  thumbWrapper: { width: '100%', aspectRatio: 16 / 9, position: 'relative' },
  thumbnail: { width: '100%', height: '100%' },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  playEmoji: { fontSize: 40, color: '#fff' },
  playOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: { fontSize: 22, color: '#fff', marginLeft: 3 },
  badge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  meta: {
    padding: Spacing.three,
    borderTopWidth: 1,
    gap: 4,
  },
  title: { fontSize: 14, fontWeight: '600', lineHeight: 19 },
});
