import React, { useCallback, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LinkCard } from '@/components/ui/LinkCard';
import { QuickAddBar } from '@/components/ui/QuickAddBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import useAuthStore from '@/store/authStore';
import useCollectionsStore from '@/store/collectionStore';
import api from '@/lib/api';
import { formatLinksForMobile } from '@/lib/formatLinks';
import { fetchedCollectionType, fetchedLinkType } from '@/types';

export default function InboxScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const profile = useAuthStore((s) => s.profile);
  const { inbox, inboxLinks, setInbox, setInboxLinks, addInboxLinkItem, removeInboxLinkItem } =
    useCollectionsStore();
  const [loading, setLoading] = useState(true);
  const [quickAddLoading, setQuickAddLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!profile?._id) { setLoading(false); return; }
      (async () => {
        try {
          setLoading(true);
          // Ensure inbox collection is loaded
          if (!inbox) {
            const collRes = await api.get(`/collections/u/all/${profile._id}`);
            if (collRes.status === 200) {
              const all: fetchedCollectionType[] = collRes.data.data;
              const inboxCol = all.find((c) => c.isInbox) ?? null;
              setInbox(inboxCol);
              if (inboxCol) {
                try {
                  const linksRes = await api.get(`/links/collection/${inboxCol._id}`);
                  if (linksRes.status === 200) {
                    setInboxLinks(formatLinksForMobile(linksRes.data.data ?? []));
                  }
                } catch (linkErr: any) {
                  // 404 just means empty collection — not an error
                  if (linkErr?.response?.status !== 404) throw linkErr;
                  setInboxLinks([]);
                }
              }
            }
          } else if (inboxLinks.length === 0) {
            try {
              const linksRes = await api.get(`/links/collection/${inbox._id}`);
              if (linksRes.status === 200) {
                setInboxLinks(formatLinksForMobile(linksRes.data.data ?? []));
              }
            } catch (linkErr: any) {
              if (linkErr?.response?.status !== 404) throw linkErr;
              setInboxLinks([]);
            }
          }
        } catch (err: any) {
          console.error('Failed to load inbox', err.message);
        } finally {
          setLoading(false);
        }
      })();
    }, [profile?._id]),
  );

  const handleQuickAdd = async (url: string) => {
    if (!inbox?._id || !profile?._id) {
      Alert.alert('Not ready', 'Please wait while your inbox loads');
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
          contentType: res.data.data.link.contentType ?? res.data.data.data?.contentType ?? 'link',
        };
        addInboxLinkItem(formatted);
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
            removeInboxLinkItem(link._id);
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete');
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

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
        <View>
          <ThemedText type="subtitle" style={styles.headerTitle}>
            Inbox
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {inboxLinks.length} link{inboxLinks.length !== 1 ? 's' : ''}
          </ThemedText>
        </View>
      </View>

      {/* Quick add */}
      <View style={[styles.quickAdd, { borderBottomColor: theme.border }]}>
        <QuickAddBar
          placeholder="Paste a link to inbox..."
          onSubmit={handleQuickAdd}
          loading={quickAddLoading}
        />
      </View>

      {loading ? (
        <LoadingSpinner fullScreen message="Loading inbox..." />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom }]}
          showsVerticalScrollIndicator={false}
        >
          {inboxLinks.length === 0 ? (
            <EmptyState
              icon="📭"
              title="Inbox is empty"
              subtitle="Use the bar above to quickly save any link"
            />
          ) : (
            inboxLinks.map((link) => (
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
  },
  quickAdd: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
  },
  scroll: {
    padding: Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
});
