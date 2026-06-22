import { Redirect } from 'expo-router';

// (tabs) group has its own _layout with NativeTabs — no extra wrapper needed
export default function TabsLayout() {
  return <Redirect href="/(tabs)/index" />;
}
