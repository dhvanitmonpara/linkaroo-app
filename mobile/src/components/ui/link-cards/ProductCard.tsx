import React from 'react';
import { Pressable, StyleSheet, View, Image, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { fetchedLinkType } from '@/types';

type Props = { link: fetchedLinkType; onLongPress?: () => void };

function getStore(url: string): { label: string; color: string } {
  try {
    const host = new URL(url).hostname.replace('www.', '');
    if (host.includes('amazon')) return { label: 'Amazon', color: '#FF9900' };
    if (host.includes('ebay')) return { label: 'eBay', color: '#e53238' };
    if (host.includes('etsy')) return { label: 'Etsy', color: '#F56400' };
    if (host.includes('flipkart')) return { label: 'Flipkart', color: '#2874F0' };
    return { label: host, color: '#888' };
  } catch {
    return { label: 'Shop', color: '#888' };
  }
}

function extractPrice(description: string): string | null {
  const match = description.match(/[\$€£₹]\s?\d[\d,]*\.?\d{0,2}/);
  return match ? match[0] : null;
}

export function ProductCard({ link, onLongPress }: Props) {
  const theme = useTheme();
  const open = () =>
    WebBrowser.openBrowserAsync(link.link).catch(() => Linking.openURL(link.link));

  const { label, color } = getStore(link.link);
  const price = link.description ? extractPrice(link.description) : null;

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
      {/* Product image */}
      <View style={styles.imageWrap}>
        {link.image ? (
          <Image source={{ uri: link.image }} style={styles.image} resizeMode="contain" />
        ) : (
          <ThemedView type="backgroundSelected" style={[styles.image, styles.imageFallback]}>
            <ThemedText style={styles.fallbackEmoji}>🛒</ThemedText>
          </ThemedView>
        )}
      </View>

      {/* Details */}
      <View style={styles.details}>
        {/* Store badge */}
        <View style={[styles.storeBadge, { backgroundColor: color + '22', borderColor: color + '66' }]}>
          <ThemedText style={[styles.storeText, { color }]}>{label}</ThemedText>
        </View>

        <ThemedText numberOfLines={3} style={styles.title}>
          {link.title || 'Product'}
        </ThemedText>

        {price && (
          <ThemedText style={[styles.price, { color: theme.primary }]}>
            {price}
          </ThemedText>
        )}

        {link.description && !price && (
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
    flexDirection: 'row',
    borderRadius: Spacing.three,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.two,
    minHeight: 120,
  },
  imageWrap: {
    width: 100,
    backgroundColor: '#f5f5f5',
    flexShrink: 0,
  },
  image: { width: '100%', height: '100%' },
  imageFallback: { alignItems: 'center', justifyContent: 'center' },
  fallbackEmoji: { fontSize: 32 },
  details: {
    flex: 1,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  storeBadge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    marginBottom: Spacing.one,
  },
  storeText: { fontSize: 11, fontWeight: '700' },
  title: { fontSize: 14, fontWeight: '600', lineHeight: 19 },
  price: { fontSize: 16, fontWeight: '800' },
  desc: { fontSize: 12, lineHeight: 17 },
});
