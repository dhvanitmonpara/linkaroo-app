'use client';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { QuickAddBar } from '@/components/ui/QuickAddBar';
import { CollectionCard } from '@/components/ui/CollectionCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import useAuthStore from '@/store/authStore';
import useCollectionsStore from '@/store/collectionStore';
import api from '@/lib/api';
import { fetchedCollectionType, fetchedLinkType } from '@/types';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';

export default function HomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const { collections, inbox, setCollections, setInbox, addInboxLinkItem } = useCollectionsStore();
  const [loading, setLoading] = useState(true);
  const [quickAddLoading, setQuickAddLoading] = useState(false);

  const greetingTime = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Fetch collections & inbox on focus if not cached
  useFocusEffect(
    useCallback(() => {
      if (!profile?._id) { setLoading(false); return; }
      if (collections.length > 0) { setLoading(false); return; }
      (async () => {
        try {
          setLoading(true);
          const res = await api.get(`/collections/u/all/${profile._id}`);
          if (res.status === 200) {
            const all: fetchedCollectionType[] = res.data.data;
            const inboxCol = all.find((c) => c.isInbox);
            const regular = all.filter((c) => !c.isInbox);
            setCollections(regular);
            setInbox(inboxCol ?? null);
          }
        } catch (err: any) {
          console.error('Failed to load collections', err.message);
        } finally {
          setLoading(false);
        }
      })();
    }, [profile?._id]),
  );

  const handleQuickAdd = async (url: string) => {
    if (!inbox?._id || !profile?._id) {
      Alert.alert('Not ready', 'Please wait while your data loads');
      return;
    }
    try {
      setQuickAddLoading(true);
      const res = await api.post(`/links/quick-add/${inbox._id}`, {
        link: url,
        userId: profile._id,
      });
      if (res.status === 201) {
        const userLink = res.data.data.userLink;
        const formattedLink: fetchedLinkType = {
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
        };
        addInboxLinkItem(formattedLink);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add link');
    } finally {
      setQuickAddLoading(false);
    }
  };

  const paddingBottom = BottomTabInset + Spacing.four;

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + Spacing.four,
            paddingBottom,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText themeColor="textSecondary" style={styles.greeting}>
              {greetingTime()},
            </ThemedText>
            <ThemedText type="subtitle" style={styles.username}>
              {profile?.fullName || profile?.username || 'there'} 👋
            </ThemedText>
          </View>
        </View>

        {/* Quick add bar */}
        <View style={styles.quickAddWrap}>
          <QuickAddBar
            placeholder="Paste a link to save..."
            onSubmit={handleQuickAdd}
            loading={quickAddLoading}
          />
        </View>

        {/* Collections section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Your Collections</ThemedText>
            <ThemedText
              style={[styles.seeAll, { color: theme.primary }]}
              onPress={() => router.push('/(tabs)/collections')}
            >
              See all
            </ThemedText>
          </View>

          {loading ? (
            <LoadingSpinner message="Loading collections..." />
          ) : collections.length === 0 ? (
            <EmptyState
              icon="📚"
              title="No collections yet"
              subtitle="Create your first collection to start organizing links"
            />
          ) : (
            collections.slice(0, 5).map((col) => (
              <CollectionCard
                key={col._id}
                collection={col}
                onPress={() => router.push(`/collection/${col._id}` as any)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.four,
  },
  greeting: {
    fontSize: 14,
    marginBottom: 2,
  },
  username: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
  },
  quickAddWrap: {
    marginBottom: Spacing.five,
  },
  section: {
    gap: Spacing.two,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.one,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
  },
});
