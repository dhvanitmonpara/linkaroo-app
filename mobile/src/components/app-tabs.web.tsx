import { Link, usePathname } from 'expo-router';
import { Pressable, StyleSheet, View, useColorScheme } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';

type Tab = {
  name: string;
  href: string;
  label: string;
};

const TABS: Tab[] = [
  { name: 'home', href: '/(tabs)/index', label: 'Home' },
  { name: 'collections', href: '/(tabs)/collections', label: 'Collections' },
  { name: 'inbox', href: '/(tabs)/inbox', label: 'Inbox' },
  { name: 'profile', href: '/(tabs)/profile', label: 'Profile' },
];

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'dark' : scheme ?? 'dark'];
  const pathname = usePathname();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Top nav bar */}
      <View style={[styles.navbar, { backgroundColor: colors.backgroundElement, borderBottomColor: colors.border }]}>
        <View style={styles.inner}>
          {/* Brand */}
          <ThemedText style={[styles.brand, { color: colors.primary }]}>
            Linkaroo
          </ThemedText>

          {/* Tab links */}
          <View style={styles.tabs}>
            {TABS.map((tab) => {
              const isActive =
                tab.href === '/(tabs)/index'
                  ? pathname === '/' || pathname === '/index' || pathname.startsWith('/(tabs)/index') || pathname === ''
                  : pathname.includes(tab.name);
              return (
                <Link key={tab.name} href={tab.href as any} asChild>
                  <Pressable
                    style={StyleSheet.flatten([
                      styles.tabBtn,
                      {
                        backgroundColor: isActive ? colors.backgroundSelected : 'transparent',
                      },
                    ])}
                  >
                    <ThemedText
                      style={[
                        styles.tabLabel,
                        { color: isActive ? colors.text : colors.textSecondary },
                      ]}
                    >
                      {tab.label}
                    </ThemedText>
                  </Pressable>
                </Link>
              );
            })}
          </View>
        </View>
      </View>

      {/* Page content — expo-router renders children via the slot mechanism,
          but on web the AppTabs wraps AppTabs renders nothing itself; 
          the route content is rendered by expo-router above this component. */}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  navbar: {
    width: '100%',
    borderBottomWidth: 1,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  brand: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginRight: 'auto',
  },
  tabs: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  tabBtn: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: 8,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});
