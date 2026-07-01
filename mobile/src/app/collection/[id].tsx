import React, { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LinkCard } from '@/components/ui/LinkCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { QuickAddBar } from '@/components/ui/QuickAddBar';
import { Spacing } from '@/constants/theme';
import useAuthStore from '@/store/authStore';
import useCollectionsStore from '@/store/collectionStore';
import useLinkStore from '@/store/linkStore';
import api from '@/lib/api';
import { formatLinksForMobile } from '@/lib/formatLinks';
import { colorMap, fetchedLinkType } from '@/types';

export default function CollectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const { collections } = useCollectionsStore();
  const { cachedLinks, setCachedLinks, addCachedLinkItem, removeCachedLinkItem } = useLinkStore();

  const collection = collections.find((c) => c._id === id);
  const accentColor = collection ? (colorMap[collection.theme] ?? theme.primary) : theme.primary;

  const cached = cachedLinks.find((c) => c.collectionId === id);
  const [loading, setLoading] = useState(!cached);
  const [quickAddLoading, setQuickAddLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!id || cached) return;
      (async () => {
        try {
          setLoading(true);
          const res = await api.get(`/links/collection/${id}`);
          if (res.status === 200) {
            setCachedLinks(id, formatLinksForMobile(res.data.data ?? []));
          }
        } catch (err: any) {
          if (err?.response?.status === 404) {
            // 404 = no links yet — treat as empty, not an error
            setCachedLinks(id, []);
          } else {
            console.error('Failed to load links', err.message);
          }
        } finally {
          setLoading(false);
        }
      })();
    }, [id]),
  );

  const links = cached?.links ?? [];

  const handleQuickAdd = async (url: string) => {
    if (!id || !profile?._id) return;
    try {
      setQuickAddLoading(true);
      const res = await api.post(`/links/quick-add/${id}`, {
        link: url,
        userId: profile._id,
      });
      if (res.status === 201) {
        const userLink = res.data.data.userLink;
        const formatted: fetchedLinkType = {
          _id: userLink._id,
          title: userLink.customTitle,
          description: userLink.customDescription,
          link: res.data.data.link.link,
          userId: userLink.userId,
          createdAt: userLink.createdAt,
          updatedAt: userLink.updatedAt,
          collectionId: userLink.collectionId,
          image: res.data.data.link.image,
          isChecked: userLink.isChecked,
          __v: userLink.__v,
          contentType: res.data.data.link.contentType ?? 'link',
        };
        addCachedLinkItem(id, formatted);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add link');
    } finally {
      setQuickAddLoading(false);
    }
  };

  const handleLongPress = (link: fetchedLinkType) => {
    Alert.alert(link.title || 'Link', link.link, [
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/links/${link._id}`);
            removeCachedLinkItem(id!, link._id);
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete');
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      {/* Nav header */}
      <View
        style={[
          styles.navBar,
          { paddingTop: insets.top + Spacing.two, borderBottomColor: theme.border },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ThemedText style={[styles.backIcon, { color: theme.primary }]}>←</ThemedText>
        </Pressable>
        <ThemedText numberOfLines={1} style={styles.navTitle}>
          {collection?.title ?? 'Collection'}
        </ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {/* Collection hero */}
      <View style={[styles.hero, { borderBottomColor: theme.border }]}>
        <View style={[styles.accentDot, { backgroundColor: accentColor }]} />
        <View style={styles.heroText}>
          <View style={styles.heroTitleRow}>
            {collection?.icon ? (
              <ThemedText style={styles.heroIcon}>{collection.icon}</ThemedText>
            ) : null}
            <ThemedText style={styles.heroTitle}>{collection?.title}</ThemedText>
          </View>
          {collection?.description ? (
            <ThemedText themeColor="textSecondary" style={styles.heroDesc} numberOfLines={2}>
              {collection.description}
            </ThemedText>
          ) : null}
          <ThemedText type="small" themeColor="textSecondary">
            {links.length} link{links.length !== 1 ? 's' : ''}
          </ThemedText>
        </View>
      </View>

      {/* Quick add */}
      <View style={[styles.quickAdd, { borderBottomColor: theme.border }]}>
        <QuickAddBar
          placeholder="Add a link to this collection..."
          onSubmit={handleQuickAdd}
          loading={quickAddLoading}
        />
      </View>

      {loading ? (
        <LoadingSpinner fullScreen message="Loading links..." />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {links.length === 0 ? (
            <EmptyState
              icon="🔗"
              title="No links yet"
              subtitle="Add links to this collection using the bar above"
            />
          ) : (
            links.map((link) => (
              <LinkCard
                key={link._id}
                link={link}
                onLongPress={() => handleLongPress(link)}
              />
            ))
          )}
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.two,
    paddingBottom: Spacing.two,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 22,
    fontWeight: '600',
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  hero: {
    flexDirection: 'row',
    padding: Spacing.three,
    borderBottomWidth: 1,
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  accentDot: {
    width: 4,
    borderRadius: 4,
    alignSelf: 'stretch',
  },
  heroText: {
    flex: 1,
    gap: 4,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroIcon: { fontSize: 20 },
  heroTitle: { fontSize: 20, fontWeight: '700' },
  heroDesc: { fontSize: 14 },
  quickAdd: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
  },
  scroll: {
    padding: Spacing.three,
  },
});
