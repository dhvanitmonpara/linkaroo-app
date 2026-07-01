import React from 'react';
import { Pressable, StyleSheet, View, Image, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { fetchedLinkType } from '@/types';

type Props = { link: fetchedLinkType; onLongPress?: () => void };

function getDomain(url: string) {
  try { return new URL(url).hostname.replace('www.', ''); } catch { return url; }
}

/** Rough reading-time estimate: ~200 wpm, description as proxy for content length */
function estimateReadTime(description: string): string {
  const words = description.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil((words / 200) * 10)); // scale up since desc is short
  return `${minutes} min read`;
}

export function ArticleCard({ link, onLongPress }: Props) {
  const theme = useTheme();
  const open = () =>
    WebBrowser.openBrowserAsync(link.link).catch(() => Linking.openURL(link.link));

  const domain = getDomain(link.link);
  const readTime = link.description ? estimateReadTime(link.description) : null;

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
      {/* Hero image */}
      {link.image ? (
        <Image
          source={{ uri: link.image }}
          style={styles.hero}
          resizeMode="cover"
        />
      ) : (
        <ThemedView type="backgroundSelected" style={[styles.hero, styles.heroFallback]}>
          <ThemedText style={styles.heroEmoji}>📰</ThemedText>
        </ThemedView>
      )}

      {/* Article meta */}
      <View style={[styles.body, { borderTopColor: theme.border }]}>
        {/* Domain + read time row */}
        <View style={styles.metaRow}>
          <ThemedText type="small" themeColor="textSecondary">
            {domain}
          </ThemedText>
          {readTime && (
            <>
              <ThemedText type="small" themeColor="textSecondary"> · </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                📖 {readTime}
              </ThemedText>
            </>
          )}
        </View>

        {/* Headline */}
        <ThemedText numberOfLines={3} style={styles.title}>
          {link.title || 'Article'}
        </ThemedText>

        {/* Description */}
        {link.description && (
          <ThemedText numberOfLines={2} themeColor="textSecondary" style={styles.desc}>
            {link.description}
          </ThemedText>
        )}
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
  hero: { width: '100%', height: 180 },
  heroFallback: { alignItems: 'center', justifyContent: 'center' },
  heroEmoji: { fontSize: 40 },
  body: {
    padding: Spacing.three,
    borderTopWidth: 1,
    gap: Spacing.one,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '700', lineHeight: 22 },
  desc: { fontSize: 13, lineHeight: 18 },
});
