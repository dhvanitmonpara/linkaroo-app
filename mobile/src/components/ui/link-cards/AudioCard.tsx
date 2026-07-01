import React from 'react';
import { Pressable, StyleSheet, View, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { fetchedLinkType } from '@/types';

type Props = { link: fetchedLinkType; onLongPress?: () => void };

function getFileName(url: string): string {
  try {
    return new URL(url).pathname.split('/').pop() ?? url;
  } catch {
    return url;
  }
}

function getSourceLabel(url: string): string {
  try {
    const host = new URL(url).hostname.replace('www.', '');
    if (host.includes('spotify')) return 'Spotify';
    if (host.includes('soundcloud')) return 'SoundCloud';
    return host;
  } catch {
    return 'Audio';
  }
}

export function AudioCard({ link, onLongPress }: Props) {
  const theme = useTheme();
  const open = () =>
    WebBrowser.openBrowserAsync(link.link).catch(() => Linking.openURL(link.link));

  const fileName = link.title || getFileName(link.link);
  const source = getSourceLabel(link.link);

  // Waveform bars (decorative)
  const barHeights = [12, 20, 28, 18, 32, 24, 16, 30, 22, 14, 26, 20, 12, 28, 18];

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
      {/* Waveform visualization area */}
      <ThemedView type="backgroundSelected" style={styles.waveArea}>
        {/* Play button */}
        <View style={[styles.playBtn, { backgroundColor: theme.primary }]}>
          <ThemedText style={styles.playIcon}>▶</ThemedText>
        </View>

        {/* Decorative waveform bars */}
        <View style={styles.waveform}>
          {barHeights.map((h, i) => (
            <View
              key={i}
              style={[
                styles.bar,
                {
                  height: h,
                  backgroundColor: i < 8 ? theme.primary : theme.border,
                  opacity: i < 8 ? 1 : 0.5,
                },
              ]}
            />
          ))}
        </View>
      </ThemedView>

      {/* Meta */}
      <View style={[styles.meta, { borderTopColor: theme.border }]}>
        <ThemedText numberOfLines={1} style={styles.title}>
          {fileName}
        </ThemedText>
        <View style={styles.row}>
          <ThemedText type="small" themeColor="textSecondary">
            🎵 {source}
          </ThemedText>
        </View>
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
  waveArea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.three,
    height: 80,
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  playIcon: { fontSize: 16, color: '#fff', marginLeft: 2 },
  waveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    overflow: 'hidden',
  },
  bar: {
    width: 3,
    borderRadius: 2,
    flex: 1,
  },
  meta: {
    padding: Spacing.three,
    borderTopWidth: 1,
    gap: 4,
  },
  title: { fontSize: 14, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
