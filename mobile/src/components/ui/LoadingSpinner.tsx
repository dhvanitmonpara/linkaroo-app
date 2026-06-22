import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';

type LoadingSpinnerProps = {
  message?: string;
  size?: 'small' | 'large';
  fullScreen?: boolean;
};

export function LoadingSpinner({
  message,
  size = 'large',
  fullScreen = false,
}: LoadingSpinnerProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.container,
        fullScreen && styles.fullScreen,
        { backgroundColor: fullScreen ? theme.background : 'transparent' },
      ]}
    >
      <ActivityIndicator size={size} color={theme.primary} />
      {message && (
        <ThemedText
          type="small"
          themeColor="textSecondary"
          style={styles.message}
        >
          {message}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 24,
  },
  fullScreen: {
    flex: 1,
  },
  message: {
    marginTop: 8,
    textAlign: 'center',
  },
});
