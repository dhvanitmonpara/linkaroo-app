import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { fetchedCollectionType, colorMap } from '@/types';
import { Spacing } from '@/constants/theme';

type CollectionCardProps = {
  collection: fetchedCollectionType;
  onPress?: () => void;
};

export function CollectionCard({ collection, onPress }: CollectionCardProps) {
  const theme = useTheme();
  const accentColor = colorMap[collection.theme] ?? theme.primary;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
          opacity: pressed ? 0.88 : 1,
        },
      ]}
      android_ripple={{ color: theme.backgroundSelected, borderless: false }}
    >
      {/* Accent stripe */}
      <View style={[styles.stripe, { backgroundColor: accentColor }]} />

      <View style={styles.body}>
        {/* Icon + title row */}
        <View style={styles.header}>
          {collection.icon ? (
            <ThemedText style={styles.icon}>{collection.icon}</ThemedText>
          ) : null}
          <ThemedText numberOfLines={1} style={styles.title}>
            {collection.title}
          </ThemedText>
        </View>

        {collection.description ? (
          <ThemedText
            type="small"
            themeColor="textSecondary"
            numberOfLines={2}
            style={styles.desc}
          >
            {collection.description}
          </ThemedText>
        ) : null}

        {/* Tags */}
        {collection.tags.length > 0 && (
          <View style={styles.tags}>
            {collection.tags.slice(0, 3).map((tag) => (
              <View
                key={tag._id}
                style={[styles.tag, { backgroundColor: theme.backgroundSelected }]}
              >
                <ThemedText type="small" style={styles.tagText}>
                  {tag.tagname}
                </ThemedText>
              </View>
            ))}
            {collection.tags.length > 3 && (
              <ThemedText type="small" themeColor="textSecondary">
                +{collection.tags.length - 3}
              </ThemedText>
            )}
          </View>
        )}
      </View>

      {/* Collaborators count */}
      {collection.collaborators.length > 0 && (
        <View style={styles.collab}>
          <ThemedText type="small" themeColor="textSecondary">
            👥 {collection.collaborators.length}
          </ThemedText>
        </View>
      )}
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
  },
  stripe: {
    width: 5,
  },
  body: {
    flex: 1,
    padding: Spacing.three,
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  icon: {
    fontSize: 18,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  desc: {
    lineHeight: 18,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 100,
  },
  tagText: {
    fontSize: 11,
  },
  collab: {
    padding: Spacing.two,
    justifyContent: 'center',
  },
});
