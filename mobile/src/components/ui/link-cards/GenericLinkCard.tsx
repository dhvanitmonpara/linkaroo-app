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

/** Fallback compact horizontal card — same as the original design */
export function GenericLinkCard({ link, onLongPress }: Props) {
  const theme = useTheme();

  const open = () =>
    WebBrowser.openBrowserAsync(link.link).catch(() => Linking.openURL(link.link));

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
      {link.image ? (
        <Image source={{ uri: link.image }} style={styles.thumbnail} resizeMode="cover" />
      ) : (
        <ThemedView type="backgroundSelected" style={[styles.thumbnail, styles.thumbnailFallback]}>
          <ThemedText style={styles.emoji}>🔗</ThemedText>
        </ThemedView>
      )}

      <View style={styles.content}>
        <ThemedText numberOfLines={2} style={styles.title}>
          {link.title || getDomain(link.link)}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {getDomain(link.link)}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacing.three,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.two,
  },
  thumbnail: { width: 72, height: 72 },
  thumbnailFallback: { alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 24 },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: 4,
  },
  title: { fontSize: 15, fontWeight: '600', lineHeight: 20 },
});
