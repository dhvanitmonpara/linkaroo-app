import React, { useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CollectionCard } from '@/components/ui/CollectionCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CollectionFormSheet } from '@/components/ui/CollectionFormSheet';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import useAuthStore from '@/store/authStore';
import useCollectionsStore from '@/store/collectionStore';
import api from '@/lib/api';
import { fetchedCollectionType } from '@/types';

export default function CollectionsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const { collections, setCollections, setInbox } = useCollectionsStore();
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!profile?._id) { setLoading(false); return; }
      (async () => {
        try {
          setLoading(true);
          const res = await api.get(`/collections/u/all/${profile._id}`);
          if (res.status === 200) {
            const all: fetchedCollectionType[] = res.data.data;
            setCollections(all.filter((c) => !c.isInbox));
            setInbox(all.find((c) => c.isInbox) ?? null);
          }
        } catch (err: any) {
          console.error('Failed to load collections', err.message);
        } finally {
          setLoading(false);
        }
      })();
    }, [profile?._id]),
  );

  const paddingBottom = BottomTabInset + Spacing.four;

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + Spacing.three,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <ThemedText type="subtitle" style={styles.headerTitle}>
          Collections
        </ThemedText>
        <Pressable
          onPress={() => setShowForm(true)}
          style={[styles.fab, { backgroundColor: theme.primary }]}
          android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: false }}
        >
          <ThemedText style={styles.fabText}>＋ New</ThemedText>
        </Pressable>
      </View>

      {loading ? (
        <LoadingSpinner fullScreen message="Loading collections..." />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {collections.length === 0 ? (
            <EmptyState
              icon="📂"
              title="No collections"
              subtitle="Tap '+ New' to create your first collection"
            />
          ) : (
            collections.map((col) => (
              <CollectionCard
                key={col._id}
                collection={col}
                onPress={() => router.push(`/collection/${col._id}` as any)}
              />
            ))
          )}
        </ScrollView>
      )}

      {/* Create collection modal */}
      <CollectionFormSheet
        visible={showForm}
        onClose={() => setShowForm(false)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 4,
    borderRadius: 100,
  },
  fabText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  scroll: {
    padding: Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
});
