import React from 'react';
import { Pressable, StyleSheet, View, Image, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { fetchedLinkType } from '@/types';

type Props = { link: fetchedLinkType; onLongPress?: () => void };

type GitHubKind = 'repo' | 'profile';

function parseGitHub(url: string): { kind: GitHubKind; owner: string; repo?: string } {
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean);
    if (parts.length >= 2) return { kind: 'repo', owner: parts[0], repo: parts[1] };
    if (parts.length === 1) return { kind: 'profile', owner: parts[0] };
  } catch {}
  return { kind: 'profile', owner: 'GitHub' };
}

export function GitHubCard({ link, onLongPress }: Props) {
  const theme = useTheme();
  const open = () =>
    WebBrowser.openBrowserAsync(link.link).catch(() => Linking.openURL(link.link));

  const { kind, owner, repo } = parseGitHub(link.link);

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
      {/* Header */}
      <View style={styles.header}>
        {link.image ? (
          <Image source={{ uri: link.image }} style={styles.avatar} />
        ) : (
          <ThemedView type="backgroundSelected" style={[styles.avatar, styles.avatarFallback]}>
            <ThemedText style={styles.avatarEmoji}>⌥</ThemedText>
          </ThemedView>
        )}

        <View style={styles.headerText}>
          {kind === 'repo' ? (
            <>
              <ThemedText style={styles.repoName} numberOfLines={1}>
                {owner}/<ThemedText style={styles.repoBold}>{repo}</ThemedText>
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                GitHub Repository
              </ThemedText>
            </>
          ) : (
            <>
              <ThemedText style={styles.repoName} numberOfLines={1}>
                {owner}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                GitHub Profile
              </ThemedText>
            </>
          )}
        </View>

        {/* Octocat badge */}
        <View style={[styles.brand, { backgroundColor: '#24292f' }]}>
          <ThemedText style={styles.brandText}>⌥</ThemedText>
        </View>
      </View>

      {/* Description */}
      {link.description ? (
        <ThemedText numberOfLines={2} themeColor="textSecondary" style={styles.desc}>
          {link.description}
        </ThemedText>
      ) : null}

      {/* Bottom pills */}
      <View style={styles.pills}>
        <ThemedView type="backgroundSelected" style={styles.pill}>
          <ThemedText style={styles.pillText}>
            {kind === 'repo' ? '📦 Repo' : '👤 Profile'}
          </ThemedText>
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
    padding: Spacing.three,
    gap: Spacing.two,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 22 },
  headerText: { flex: 1 },
  repoName: { fontSize: 14 },
  repoBold: { fontWeight: '700' },
  brand: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: { fontSize: 14, color: '#fff' },
  desc: { fontSize: 13, lineHeight: 18 },
  pills: { flexDirection: 'row', gap: Spacing.one, flexWrap: 'wrap' },
  pill: {
    borderRadius: 20,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
  },
  pillText: { fontSize: 11, fontWeight: '600' },
});
