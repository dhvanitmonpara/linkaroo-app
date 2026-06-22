import React, { useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type QuickAddBarProps = {
  placeholder?: string;
  onSubmit: (value: string) => Promise<void> | void;
  loading?: boolean;
};

export function QuickAddBar({
  placeholder = 'Quick add a link...',
  onSubmit,
  loading = false,
}: QuickAddBarProps) {
  const theme = useTheme();
  const [value, setValue] = useState('');
  const btnScale = useRef(new Animated.Value(0)).current;

  const handleChangeText = (text: string) => {
    setValue(text);
    Animated.spring(btnScale, {
      toValue: text.length > 0 ? 1 : 0,
      useNativeDriver: true,
      friction: 6,
    }).start();
  };

  const handleSubmit = async () => {
    if (!value.trim() || loading) return;
    await onSubmit(value.trim());
    setValue('');
    Animated.spring(btnScale, {
      toValue: 0,
      useNativeDriver: true,
      friction: 6,
    }).start();
  };

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
        },
      ]}
    >
      <TextInput
        style={[styles.input, { color: theme.text }]}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        value={value}
        onChangeText={handleChangeText}
        onSubmitEditing={handleSubmit}
        returnKeyType="done"
        autoCorrect={false}
        autoCapitalize="none"
        editable={!loading}
      />
      <Animated.View style={{ transform: [{ scale: btnScale }] }}>
        <Pressable
          onPress={handleSubmit}
          style={[styles.btn, { backgroundColor: theme.primary }]}
          android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: false }}
        >
          <ThemedText style={styles.btnText}>
            {loading ? '...' : 'Add'}
          </ThemedText>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 100,
    borderWidth: 1,
    paddingLeft: Spacing.three,
    paddingRight: 6,
    paddingVertical: 6,
    gap: Spacing.two,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: Spacing.one,
  },
  btn: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 100,
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
