import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  Alert,
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { colorMap, colorOptions } from '@/types';
import api from '@/lib/api';
import useAuthStore from '@/store/authStore';
import useCollectionsStore from '@/store/collectionStore';

type CollectionFormSheetProps = {
  visible: boolean;
  onClose: () => void;
};

const THEME_OPTIONS: colorOptions[] = [
  'bg-zinc-200',
  'bg-blue-400',
  'bg-emerald-400',
  'bg-purple-400',
  'bg-amber-400',
  'bg-rose-400',
  'bg-orange-600',
  'bg-indigo-400',
  'bg-teal-400',
  'bg-black',
];

const ICON_OPTIONS = [
  '📁', '🎬', '📚', '🎵', '🎮', '🍕', '⚽', '🔖', '🌟', '💡',
  '🔗', '📝', '🎯', '🏆', '🚀', '💎', '🌈', '🔥',
];

export function CollectionFormSheet({ visible, onClose }: CollectionFormSheetProps) {
  const theme = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const { addCollectionsItem } = useCollectionsStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('📁');
  const [selectedTheme, setSelectedTheme] = useState<colorOptions>('bg-blue-400');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setTitle('');
    setDescription('');
    setSelectedIcon('📁');
    setSelectedTheme('bg-blue-400');
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a collection title');
      return;
    }
    if (!profile?._id) return;

    try {
      setLoading(true);
      const response = await api.post('/collections', {
        title: title.trim(),
        description: description.trim(),
        icon: selectedIcon,
        theme: selectedTheme,
        userId: profile._id,
      });

      if (response.status === 201) {
        addCollectionsItem(response.data.data);
        reset();
        onClose();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create collection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Pressable onPress={onClose} style={styles.cancelBtn}>
            <ThemedText style={[styles.cancelText, { color: theme.primary }]}>
              Cancel
            </ThemedText>
          </Pressable>
          <ThemedText style={styles.headerTitle}>New Collection</ThemedText>
          <Pressable
            onPress={handleCreate}
            style={[styles.createBtn, { backgroundColor: theme.primary }]}
            disabled={loading}
          >
            <ThemedText style={styles.createBtnText}>
              {loading ? '...' : 'Create'}
            </ThemedText>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <View style={styles.field}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
              TITLE
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: theme.border },
              ]}
              placeholder="Collection name"
              placeholderTextColor={theme.textSecondary}
              value={title}
              onChangeText={setTitle}
              maxLength={60}
            />
          </View>

          {/* Description */}
          <View style={styles.field}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
              DESCRIPTION
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                styles.multiline,
                { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: theme.border },
              ]}
              placeholder="What's this collection about?"
              placeholderTextColor={theme.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              maxLength={200}
            />
          </View>

          {/* Icon picker */}
          <View style={styles.field}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
              ICON
            </ThemedText>
            <View style={styles.iconGrid}>
              {ICON_OPTIONS.map((icon) => (
                <Pressable
                  key={icon}
                  onPress={() => setSelectedIcon(icon)}
                  style={[
                    styles.iconOption,
                    {
                      backgroundColor:
                        selectedIcon === icon
                          ? theme.primaryDim
                          : theme.backgroundElement,
                      borderColor:
                        selectedIcon === icon ? theme.primary : 'transparent',
                    },
                  ]}
                >
                  <ThemedText style={styles.iconOptionText}>{icon}</ThemedText>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Theme color picker */}
          <View style={styles.field}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
              ACCENT COLOR
            </ThemedText>
            <View style={styles.colorGrid}>
              {THEME_OPTIONS.map((color) => (
                <Pressable
                  key={color}
                  onPress={() => setSelectedTheme(color)}
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: colorMap[color] },
                    selectedTheme === color && styles.colorSwatchSelected,
                  ]}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 17,
  },
  cancelBtn: {
    padding: 4,
  },
  cancelText: {
    fontSize: 16,
  },
  createBtn: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: 8,
  },
  createBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.three,
    gap: Spacing.four,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: '700',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 4,
    fontSize: 16,
  },
  multiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  iconOptionText: {
    fontSize: 22,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: '#fff',
    transform: [{ scale: 1.15 }],
  },
});
