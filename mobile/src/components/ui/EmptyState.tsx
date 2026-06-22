import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

type EmptyStateProps = {
  title: string;
  subtitle?: string;
  icon?: string;
  action?: React.ReactNode;
};

export function EmptyState({ title, subtitle, icon = '📭', action }: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <ThemedView type="backgroundElement" style={styles.iconWrap}>
        <ThemedText style={styles.icon}>{icon}</ThemedText>
      </ThemedView>
      <ThemedText type="subtitle" style={styles.title}>
        {title}
      </ThemedText>
      {subtitle && (
        <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
          {subtitle}
        </ThemedText>
      )}
      {action && <View style={styles.action}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 36,
  },
  title: {
    fontSize: 22,
    textAlign: 'center',
    fontWeight: '600',
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
  },
  action: {
    marginTop: 16,
    width: '100%',
  },
});
