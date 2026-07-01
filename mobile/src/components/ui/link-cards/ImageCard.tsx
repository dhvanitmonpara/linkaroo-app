import React, { useState } from 'react';
import { Pressable, StyleSheet, View, Image, Linking, ActivityIndicator } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { fetchedLinkType } from '@/types';

type Props = { link: fetchedLinkType; onLongPress?: () => void };

export function ImageCard({ link, onLongPress }: Props) {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const open = () =>
    WebBrowser.openBrowserAsync(link.link).catch(() => Linking.openURL(link.link));

  const imageUri = link.image ?? link.link;

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
      {(!error && imageUri) && (
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="cover"
            onLoadEnd={() => setLoading(false)}
            onError={() => { setError(true); setLoading(false); }}
          />

          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color={theme.primary} />
            </View>
          )}

          {/* Type badge */}
          <View style={[styles.badge, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
            <ThemedText style={styles.badgeText}>🖼 Image</ThemedText>
          </View>
        </View>
      )}

      {link.title && (
        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <ThemedText numberOfLines={1} style={styles.title}>
            {link.title}
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
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 4 / 3,
    position: 'relative',
    backgroundColor: '#111',
  },
  image: { width: '100%', height: '100%' },
  errorFallback: { alignItems: 'center', justifyContent: 'center', gap: 8 },
  errorEmoji: { fontSize: 36 },
  errorText: { fontSize: 12 },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#fff' },
  footer: {
    padding: Spacing.two,
    borderTopWidth: 1,
  },
  title: { fontSize: 13, fontWeight: '500' },
});
